const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const Database = require('better-sqlite3')

// Evaluate the ACTUAL repository implementation, injecting only the DB/provider dependencies.
function loadSqliteRepo(name, db) {
  const file = path.resolve(__dirname, '../repositories', name)
  const source = fs.readFileSync(file, 'utf8')
  const container = { exports: {} }
  const controlledRequire = (request) => {
    if (request === '../db/connection') return db
    if (request === '../db/provider') return { getDbProvider: () => 'sqlite' }
    if (request === 'uuid') return { v4: randomUUID }
    if (request.startsWith('../mongo/models/')) return {}
    throw new Error('Unexpected require: ' + request)
  }
  new Function('require', 'module', 'exports', source)(controlledRequire, container, container.exports)
  return name.includes('sales') ? container.exports.getSalesRepo() : container.exports.getProductsRepo()
}

function fixture() {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(fs.readFileSync(path.resolve(__dirname, '../db/init.sql'), 'utf8'))
  db.prepare('INSERT INTO shops (id, name) VALUES (?, ?)').run('shop-a', 'A')
  db.prepare('INSERT INTO shops (id, name) VALUES (?, ?)').run('shop-b', 'B')
  db.prepare("INSERT INTO users (id, shop_id, email) VALUES ('user-a', 'shop-a', 'a@example.test')").run()
  const sales = loadSqliteRepo('sales.repo.js', db)
  const products = loadSqliteRepo('products.repo.js', db)
  const sale = (id, product_id, opts = {}) => ({
    id, code: opts.code || id, total_amount: 30000, payment_method: 'cash',
    sale_date: '2026-11-01T08:00:00Z',
    items: [{ product_id, product_name: 'QA Product', price: 15000, quantity: 2, is_quick_sale: !!opts.quick }]
  })
  const addProduct = (id, shop, barcode, stock = 5) =>
    db.prepare("INSERT INTO products(id,shop_id,barcode,name,price,stock_quantity) VALUES (?,?,?,?,?,?)")
      .run(id, shop, barcode, id, 15000, stock)
  return { db, sales, products, sale, addProduct }
}

test('quick sale works without fabricating a catalog product, stock row or inventory log', async () => {
  const f = fixture()
  try {
    const sale = f.sale('qa-sale-quick', 'new-quick-uuid', { quick: true })
    assert.equal(await f.sales.createSale('shop-a', 'user-a', sale), sale.id)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM products').get().n, 0)
    assert.equal(f.db.prepare('SELECT product_id FROM sale_items').get().product_id, null)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM inventory_logs').get().n, 0)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM cash_flows').get().n, 1)
    assert.equal(await f.sales.createSale('shop-a', 'user-a', sale), sale.id)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM cash_flows').get().n, 1)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sale_items').get().n, 1)
  } finally { f.db.close() }
})

test('normal sale updates ONLY its own shop inventory and retry does not repeat it', async () => {
  const f = fixture()
  try {
    f.addProduct('product-a', 'shop-a', 'BAR-A', 10)
    f.addProduct('product-b', 'shop-b', 'BAR-B', 15)
    const sale = f.sale('qa-normal-1', 'product-a')
    await f.sales.createSale('shop-a', 'user-a', sale)
    await f.sales.createSale('shop-a', 'user-a', sale)
    assert.equal(f.db.prepare("SELECT stock_quantity FROM products WHERE id='product-a'").get().stock_quantity, 8)
    assert.equal(f.db.prepare("SELECT stock_quantity FROM products WHERE id='product-b'").get().stock_quantity, 15)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM inventory_logs').get().n, 1)
    const other = f.sale('qa-foreign-1', 'product-b')
    await f.sales.createSale('shop-a', 'user-a', other)
    assert.equal(f.db.prepare("SELECT product_id FROM sale_items WHERE sale_id='qa-foreign-1'").get().product_id, null)
    assert.equal(f.db.prepare("SELECT stock_quantity FROM products WHERE id='product-b'").get().stock_quantity, 15)
    await f.sales.voidSale('shop-a', sale.id, 'QA')
    assert.equal(f.db.prepare("SELECT stock_quantity FROM products WHERE id='product-a'").get().stock_quantity, 10)
  } finally { f.db.close() }
})

test('two different sale ids with the same display code remain two distinct sales', async () => {
  const f = fixture()
  try {
    await f.sales.createSale('shop-a', 'user-a', f.sale('sale-id-1', null, { code: 'HD-LEGACY' }))
    await f.sales.createSale('shop-a', 'user-a', f.sale('sale-id-2', null, { code: 'HD-LEGACY' }))
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sales').get().n, 2)
  } finally { f.db.close() }
})

test('barcode collision never deletes or overwrites another existing product', async () => {
  const f = fixture()
  try {
    f.addProduct('p-a', 'shop-a', 'AAA', 3)
    f.addProduct('p-b', 'shop-a', 'BBB', 7)
    await assert.rejects(
      f.products.upsertProduct('shop-a', { id: 'p-a', barcode: 'BBB', name: 'A', price: 10000 }),
      (err) => err.status === 409 && err.code === 'BARCODE_CONFLICT'
    )
    assert.equal(f.db.prepare("SELECT barcode FROM products WHERE id='p-a'").get().barcode, 'AAA')
    assert.equal(f.db.prepare("SELECT barcode FROM products WHERE id='p-b'").get().barcode, 'BBB')
    assert.equal(f.db.prepare("SELECT stock_quantity FROM products WHERE id='p-b'").get().stock_quantity, 7)
    await assert.rejects(
      f.products.upsertProduct('shop-a', { id: 'p-c', barcode: '', name: 'Invalid' }),
      (err) => err.status === 400
    )
  } finally { f.db.close() }
})

test('repository returns created:false on idempotent replay (to avoid duplicate sheet sync)', async () => {
  const f = fixture()
  try {
    const sale = f.sale('qa-sheet-1', null)
    assert.deepEqual(await f.sales.createSale('shop-a', 'user-a', sale, { withMeta: true }),
      { id: 'qa-sheet-1', created: true })
    assert.deepEqual(await f.sales.createSale('shop-a', 'user-a', sale, { withMeta: true }),
      { id: 'qa-sheet-1', created: false })
  } finally { f.db.close() }
})

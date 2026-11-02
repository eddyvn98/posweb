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
    if (request === '../services/mongoSaleWriter') return {
      createMongoSale: async () => { throw new Error('Unexpected Mongo call in SQLite test') },
      voidMongoSale: async () => { throw new Error('Unexpected Mongo call in SQLite test') }
    }
    if (request === '../services/deliveryOutbox') return {
      ...require('../services/deliveryOutbox')
    }
    if (request === '../services/saleValidation') return require('../services/saleValidation')
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
    await assert.rejects(f.sales.createSale('shop-a', 'user-a', other), e => e.status === 400)
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM sale_items WHERE sale_id='qa-foreign-1'").get().n, 0)
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

// P0: malformed amounts, line items and foreign shop data cannot reach bookkeeping.
test('invalid sale payloads do not write sales, cashbook or inventory', async () => {
  const f = fixture()
  try {
    f.addProduct('item-validated', 'shop-a', 'VALIDATED', 30)
    const baseline = f.sale('valid-sample', 'item-validated')
    const bad = [
      { ...baseline, id: 'v1', items: [{ ...baseline.items[0], quantity: -2 }], total_amount: -30000 },
      { ...baseline, id: 'v2', items: [{ ...baseline.items[0], price: -15000 }], total_amount: -30000 },
      { ...baseline, id: 'v3', total_amount: 1 },
      { ...baseline, id: 'v4', total_amount: Infinity },
      { ...baseline, id: 'v5', total_amount: NaN },
      { ...baseline, id: 'v6', items: [] },
      { ...baseline, id: 'v7', shop_id: 'shop-b' },
      { ...baseline, id: 'v8', items: [{ ...baseline.items[0], quantity: 1.5 }] },
    ]
    for (const payload of bad) {
      await assert.rejects(f.sales.createSale('shop-a', 'user-a', payload),
        e => [400, 403].includes(e.status), 'Expected sale payload to be rejected')
    }
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sales').get().n, 0)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM cash_flows').get().n, 0)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM inventory_logs').get().n, 0)
    assert.equal(f.db.prepare("SELECT stock_quantity FROM products WHERE id='item-validated'").get().stock_quantity, 30)
  } finally { f.db.close() }
})

test('idempotency key cannot hide a different amount or payment method', async () => {
  const f = fixture()
  try {
    f.addProduct('item-validated', 'shop-a', 'VALIDATED', 30)
    const sale = f.sale('same-id', 'item-validated')
    await f.sales.createSale('shop-a', 'user-a', sale)
    await assert.rejects(f.sales.createSale('shop-a', 'user-a', {
      ...sale, total_amount: 40000, items: [{ ...sale.items[0], price: 20000 }]
    }), e => e.status === 409)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sales').get().n, 1)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM cash_flows').get().n, 1)
  } finally { f.db.close() }
})

test('SQLite voidSale allows recovery retry only when requested', async () => {
  const f = fixture()
  try {
    f.addProduct('item-validated', 'shop-a', 'VALIDATED', 30)
    const sale = f.sale('void-retry', 'item-validated')
    await f.sales.createSale('shop-a', 'user-a', sale)
    assert.deepEqual(await f.sales.voidSale('shop-a', sale.id, 'QA', { withMeta: true }), { voided: true })
    assert.deepEqual(await f.sales.voidSale('shop-a', sale.id, 'QA', {
      allowAlreadyVoided: true, withMeta: true
    }), { voided: false })
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM inventory_logs WHERE type = ?').get('void').n, 1)
    assert.equal(f.db.prepare("SELECT stock_quantity FROM products WHERE id='item-validated'").get().stock_quantity, 30)
  } finally { f.db.close() }
})

test('review1: stale product editor cannot revert inventory after a sale', async () => {
  const f = fixture()
  try {
    f.addProduct('sku-review', 'shop-a', 'REV-1', 10)
    const sale = f.sale('sale-review', 'sku-review')
    await f.sales.createSale('shop-a', 'user-a', sale)
    const stale = {
      id: 'sku-review', shop_id: 'shop-a', barcode: 'REV-1',
      name: 'Edited name', price: 15000, stock_quantity: 10,
      original_stock_quantity: 10, is_active: true
    }
    await assert.rejects(f.products.upsertProduct('shop-a', stale), e => e.status === 409)
    assert.equal(f.db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get('sku-review').stock_quantity, 8)
    await f.products.upsertProduct('shop-a', { ...stale, original_stock_quantity: 8, stock_quantity: 8 })
    assert.equal(f.db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get('sku-review').stock_quantity, 8)
    await f.products.upsertProduct('shop-a', { ...stale, name: 'Metadata update', original_stock_quantity: undefined })
    assert.equal(f.db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get('sku-review').stock_quantity, 8)
  } finally { f.db.close() }
})

test('review1: forged sale lines cannot replay an existing sale id', async () => {
  const f = fixture()
  try {
    f.addProduct('sku-review', 'shop-a', 'REV-1', 10)
    const sale = f.sale('replay-review', 'sku-review')
    await f.sales.createSale('shop-a', 'user-a', sale)
    await assert.rejects(f.sales.createSale('shop-a', 'user-a', {
      ...sale, items: [{ ...sale.items[0], product_name: 'Different item' }]
    }), e => e.status === 409)
    await assert.rejects(f.sales.createSale('shop-a', 'user-a', {
      ...sale, items: [{ ...sale.items[0], is_quick_sale: true }]
    }), e => e.status === 409 || e.status === 400)
  } finally { f.db.close() }
})

test('review1: known catalog item cannot skip stock via quick-sale flag', async () => {
  const f = fixture()
  try {
    f.addProduct('sku-review', 'shop-a', 'REV-1', 10)
    await assert.rejects(f.sales.createSale('shop-a', 'user-a',
      f.sale('bypass-review', 'sku-review', { quick: true })), e => e.status === 400)
    assert.equal(f.db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get('sku-review').stock_quantity, 10)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sales').get().n, 0)
  } finally { f.db.close() }
})

test('review2: receipt and sheet outbox are committed together and cannot duplicate on replay', async () => {
  const f = fixture()
  try {
    f.addProduct('outbox-sku', 'shop-a', 'OUT-1', 12)
    const sale = f.sale('outbox-sale', 'outbox-sku')
    await f.sales.createSale('shop-a', 'user-a', sale)
    const rows = f.db.prepare('SELECT event_key, kind FROM delivery_outbox ORDER BY event_key').all()
    assert.deepEqual(rows.map(x => x.kind).sort(), ['sheet_cash', 'sheet_sale'])
    await f.sales.createSale('shop-a', 'user-a', sale)
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM delivery_outbox').get().n, 2)
    await f.sales.voidSale('shop-a', sale.id, 'QA')
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM delivery_outbox').get().n, 3)
    assert.equal(f.db.prepare('SELECT status FROM delivery_outbox WHERE event_key = ?').get('sheet:void:outbox-sale').status, 'pending')
  } finally { f.db.close() }
})

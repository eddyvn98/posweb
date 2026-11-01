const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

function createRepo(initial) {
  const rows = initial.map(v => ({ ...v }))
  const updates = []
  const Product = {
    findOne(query) {
      return {
        lean: async () => rows.find(row => Object.entries(query).every(([k, v]) => row[k] === v)) || null,
      }
    },
    async updateOne(filter, update, options) {
      updates.push({ filter, options })
      const existing = rows.find(row => Object.entries(filter).every(([k, v]) => row[k] === v))
      if (existing) Object.assign(existing, update.$set)
      else if (options.upsert) rows.push({ ...update.$set })
      return { acknowledged: true }
    }
  }
  const source = fs.readFileSync(path.resolve(__dirname, '../repositories/products.repo.js'), 'utf8')
  const module = { exports: {} }
  const mockedRequire = (request) => {
    if (request === '../db/connection') return {}
    if (request === '../db/provider') return { getDbProvider: () => 'mongo' }
    if (request === '../mongo/models/Product') return Product
    throw new Error('Unexpected module: ' + request)
  }
  new Function('require', 'module', 'exports', source)(mockedRequire, module, module.exports)
  return { repo: module.exports.getProductsRepo(), rows, updates }
}

test('Mongo barcode edit updates original ID without creating another product', async () => {
  const fixture = createRepo([
    { id: 'id-a', shop_id: 'shop-a', barcode: 'OLD', name: 'Notebook' },
  ])
  await fixture.repo.upsertProduct('shop-a', { id: 'id-a', barcode: 'NEW', name: 'Notebook', price: 20000, is_active: true })
  assert.equal(fixture.rows.length, 1)
  assert.equal(fixture.rows[0].barcode, 'NEW')
  assert.deepEqual(fixture.updates[0].filter, { shop_id: 'shop-a', id: 'id-a' })
  assert.equal(fixture.updates[0].options.upsert, false)
})

test('Mongo barcode conflict must not alter either product', async () => {
  const fixture = createRepo([
    { id: 'id-a', shop_id: 'shop-a', barcode: 'AAA' },
    { id: 'id-b', shop_id: 'shop-a', barcode: 'BBB' },
  ])
  await assert.rejects(
    fixture.repo.upsertProduct('shop-a', { id: 'id-a', barcode: 'BBB', name: 'Duplicate' }),
    err => err.status === 409
  )
  assert.equal(fixture.updates.length, 0)
  assert.equal(fixture.rows[1].barcode, 'BBB')
})

test('Mongo new product preserves shop-barcode scoped upsert', async () => {
  const fixture = createRepo([])
  await fixture.repo.upsertProduct('shop-a', { id: 'id-a', barcode: 'AAA', name: 'Notebook', is_active: true })
  assert.equal(fixture.rows.length, 1)
  assert.deepEqual(fixture.updates[0].filter, { shop_id: 'shop-a', barcode: 'AAA' })
  assert.equal(fixture.updates[0].options.upsert, true)
})

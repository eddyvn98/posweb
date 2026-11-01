const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const origin = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:31977'

async function request(path, method = 'GET', body, token) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const json = await response.json()
  return { status: response.status, data: json }
}

async function main() {
  const suffix = randomUUID()
  const account = await request('/api/auth/register', 'POST', {
    email: `mobile-api-qa-${suffix}@example.test`,
    password: 'MobileSmokeQa123!',
    shopName: 'Mobile POS QA disposable',
  })
  assert.equal(account.status, 200, JSON.stringify(account))
  assert.ok(account.data.token)
  const token = account.data.token
  const shopId = account.data.shop.id
  const knownId = randomUUID()
  const otherId = randomUUID()
  for (const [id, barcode] of [[knownId, 'QA-A-' + suffix], [otherId, 'QA-B-' + suffix]]) {
    const result = await request('/api/products/upsert', 'POST', {
      id, shop_id: shopId, barcode, name: 'QA product', unit: 'Cái', price: 12000,
      stock_quantity: 10, is_active: true,
    }, token)
    assert.equal(result.status, 200, JSON.stringify(result))
  }

  const postSale = async (saleId, code, productId, quick) => request('/api/sales', 'POST', {
    id: saleId, shop_id: shopId, code, total_amount: 24000, payment_method: 'cash',
    sale_date: new Date().toISOString(),
    items: [{ product_id: productId, product_name: quick ? 'Quick ephemeral' : 'QA product',
      quantity: 2, price: 12000, is_quick_sale: quick }],
  }, token)

  const quickId = randomUUID()
  const quickProduct = randomUUID()
  const quick = await postSale(quickId, 'QA-QUICK-' + suffix, quickProduct, true)
  assert.equal(quick.status, 200, JSON.stringify(quick))
  assert.equal(quick.data.id, quickId)
  const replay = await postSale(quickId, 'QA-QUICK-' + suffix, quickProduct, true)
  assert.equal(replay.status, 200, JSON.stringify(replay))
  assert.equal(replay.data.id, quickId)
  let products = (await request('/api/products', 'GET', null, token)).data
  assert.equal(products.length, 2, 'Quick ephemeral item must not populate product catalog')

  const normalId = randomUUID()
  const normal = await postSale(normalId, 'QA-NORMAL-' + suffix, knownId, false)
  assert.equal(normal.status, 200, JSON.stringify(normal))
  assert.equal((await postSale(normalId, 'QA-NORMAL-' + suffix, knownId, false)).status, 200)
  products = (await request('/api/products', 'GET', null, token)).data
  assert.equal(products.find(p => p.id === knownId).stock_quantity, 8, 'Replay changed stock twice')

  const collision = await request('/api/products/upsert', 'POST', {
    id: knownId, shop_id: shopId, barcode: 'QA-B-' + suffix, name: 'collision attempt',
    unit: 'Cái', price: 1000, stock_quantity: 0, is_active: true,
  }, token)
  assert.equal(collision.status, 409, 'Duplicate barcode should return 409')
  products = (await request('/api/products', 'GET', null, token)).data
  assert.equal(products.length, 2)
  assert.equal(products.find(p => p.id === otherId).stock_quantity, 10)

  const sales = await request('/api/sales', 'GET', null, token)
  assert.equal(sales.status, 200, JSON.stringify(sales))
  assert.equal(sales.data.filter(s => s.id === quickId).length, 1, 'Quick replay created duplicate')
  assert.equal(sales.data.find(s => s.id === quickId).items[0].product_id, null)
  console.log('PASS real HTTP API: register, product create, quick with UUID, retry, stock, conflict, sales history')
}

main().catch(e => { console.error('FAIL real HTTP mobile QA smoke:', e); process.exit(1) })

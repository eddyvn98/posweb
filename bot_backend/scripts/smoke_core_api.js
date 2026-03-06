require('dotenv').config();

const axios = require('axios');
const { randomUUID } = require('crypto');

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3001';
const PASSWORD = process.env.SMOKE_PASSWORD || 'SmokeTest@123';
const EMAIL = process.env.SMOKE_EMAIL || `smoke_${Date.now()}@example.com`;
const SHOP_NAME = process.env.SMOKE_SHOP_NAME || `Smoke Shop ${Date.now()}`;

const state = {
  token: null,
  shopId: null,
  productId: null,
  barcode: `SMOKE-${Date.now()}`,
  saleId: null,
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function call(method, path, data, auth = false) {
  const headers = auth && state.token ? { Authorization: `Bearer ${state.token}` } : {};
  const response = await axios({
    method,
    url: `${BASE_URL}${path}`,
    data,
    headers,
    timeout: 20000,
    validateStatus: () => true,
  });
  return response;
}

async function step(name, fn) {
  process.stdout.write(`- ${name} ... `);
  await fn();
  console.log('OK');
}

async function run() {
  console.log(`[smoke] base_url=${BASE_URL}`);

  await step('health check dual provider', async () => {
    const res = await call('GET', '/health');
    assert(res.status === 200, `health status ${res.status}`);
    assert(res.data && res.data.status === 'ok', 'health not ok');
    if (process.env.SMOKE_EXPECT_DUAL === '1') {
      assert(res.data.provider === 'dual', `expected provider dual, got ${res.data.provider}`);
      assert(res.data.mongo && res.data.mongo.enabled === true, 'mongo not enabled in health');
      assert(res.data.mongo.connected === true, 'mongo not connected in health');
      assert(res.data.sqlite && res.data.sqlite.enabled === true, 'sqlite not enabled in dual mode');
    }
  });

  await step('register account', async () => {
    const res = await call('POST', '/api/auth/register', {
      email: EMAIL,
      password: PASSWORD,
      shopName: SHOP_NAME,
    });
    assert(res.status === 200, `register status ${res.status} body=${JSON.stringify(res.data)}`);
    assert(res.data?.token, 'missing token from register');
    state.token = res.data.token;
    state.shopId = res.data?.user?.shop_id;
    assert(state.shopId, 'missing shop_id from register');
  });

  await step('login with created account', async () => {
    const res = await call('POST', '/api/auth/login', {
      email: EMAIL,
      password: PASSWORD,
    });
    assert(res.status === 200, `login status ${res.status} body=${JSON.stringify(res.data)}`);
    assert(res.data?.token, 'missing token from login');
    state.token = res.data.token;
  });

  await step('create unit', async () => {
    const res = await call('POST', '/api/units', { name: `Thung-${Date.now()}` }, true);
    assert([201, 409].includes(res.status), `create unit status ${res.status}`);
  });

  await step('create category', async () => {
    const res = await call('POST', '/api/categories', { name: `Nhom-${Date.now()}` }, true);
    assert([200, 400].includes(res.status), `create category status ${res.status}`);
  });

  await step('upsert product', async () => {
    const productId = randomUUID();
    state.productId = productId;
    const res = await call('POST', '/api/products/upsert', {
      id: productId,
      barcode: state.barcode,
      name: `Smoke Product ${Date.now()}`,
      unit: 'Cai',
      category: 'Smoke Category',
      price: 10000,
      cost_price: 8000,
      stock_quantity: 10,
      is_active: true,
    }, true);
    assert(res.status === 200, `upsert product status ${res.status} body=${JSON.stringify(res.data)}`);
  });

  await step('list products and verify product exists', async () => {
    const res = await call('GET', '/api/products', null, true);
    assert(res.status === 200, `get products status ${res.status}`);
    const found = (res.data || []).find((p) => p.barcode === state.barcode);
    assert(!!found, 'product not found after upsert');
  });

  await step('create sale (barcode known)', async () => {
    const saleId = randomUUID();
    state.saleId = saleId;
    const res = await call('POST', '/api/sales', {
      id: saleId,
      code: `SM-${Date.now()}`,
      total_amount: 20000,
      payment_method: 'cash',
      sale_date: new Date().toISOString(),
      items: [
        {
          product_id: state.productId,
          product_name: 'Smoke Product',
          quantity: 2,
          price: 10000,
        },
      ],
    }, true);
    assert(res.status === 200, `create sale status ${res.status} body=${JSON.stringify(res.data)}`);
    assert(res.data?.id === saleId || !!res.data?.id, 'missing sale id response');
  });

  await step('verify stock reduced after sale', async () => {
    const res = await call('GET', '/api/products', null, true);
    assert(res.status === 200, `get products status ${res.status}`);
    const found = (res.data || []).find((p) => p.id === state.productId);
    assert(!!found, 'product missing when verify stock reduce');
    assert(Number(found.stock_quantity) === 8, `expected stock 8, got ${found.stock_quantity}`);
  });

  await step('create quick sale (unknown barcode/product)', async () => {
    const res = await call('POST', '/api/sales', {
      id: randomUUID(),
      code: `QS-${Date.now()}`,
      total_amount: 5000,
      payment_method: 'cash',
      sale_date: new Date().toISOString(),
      items: [
        {
          product_id: null,
          product_name: 'Quick Sale Item',
          quantity: 1,
          price: 5000,
        },
      ],
    }, true);
    assert(res.status === 200, `quick sale status ${res.status} body=${JSON.stringify(res.data)}`);
  });

  await step('void sale', async () => {
    const res = await call('POST', `/api/sales/${state.saleId}/void`, {
      reason: 'smoke-test void',
    }, true);
    assert(res.status === 200, `void sale status ${res.status} body=${JSON.stringify(res.data)}`);
  });

  await step('verify stock restored after void', async () => {
    const res = await call('GET', '/api/products', null, true);
    assert(res.status === 200, `get products status ${res.status}`);
    const found = (res.data || []).find((p) => p.id === state.productId);
    assert(!!found, 'product missing when verify stock restore');
    assert(Number(found.stock_quantity) === 10, `expected stock 10, got ${found.stock_quantity}`);
  });

  await step('list sales and verify sale exists', async () => {
    const now = new Date();
    const start = new Date(now.getTime() - 86400000).toISOString();
    const end = new Date(now.getTime() + 86400000).toISOString();
    const res = await call('GET', `/api/sales?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`, null, true);
    assert(res.status === 200, `get sales status ${res.status}`);
    const found = (res.data || []).find((s) => s.id === state.saleId);
    assert(!!found, 'sale not found in list');
    assert(!!found.is_void, 'sale should be voided');
  });

  console.log('[smoke] core flow passed');
}

run().catch((error) => {
  console.error('[smoke] failed:', error.message);
  process.exit(1);
});

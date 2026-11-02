const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

function fixture(deliver) {
  const db = new Database(':memory:');
  db.exec(fs.readFileSync(path.resolve(__dirname, '../db/init.sql'), 'utf8'));
  const source = fs.readFileSync(path.resolve(__dirname, '../services/deliveryOutboxWorker.js'), 'utf8');
  function newWorker() {
    const mod = { exports: {} };
    new Function('require', 'module', 'exports', source)((name) => {
      if (name === '../db/connection') return db;
      if (name === '../db/provider') return { getDbProvider: () => 'sqlite' };
      if (name === '../mongo/models/DeliveryOutbox') return {};
      if (name === '../mongo/models/User') return {};
      if (name === '../repositories/auth.repo') return {
        getAuthRepo: () => ({ getShopById: async () => ({ name: 'Test shop' }) })
      };
      if (name === './googleSheetService') return {
        syncSale: deliver, syncCashFlow: async () => {}, syncVoidSale: async () => {}
      };
      return require(name);
    }, mod, mod.exports);
    return mod.exports;
  }
  return { db, newWorker };
}

test('outbox retries provider failures and survives worker restart without duplicate writes', async () => {
  let calls = 0, delivered = 0;
  const previous = {
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  };
  Object.assign(process.env, {
    GOOGLE_SHEET_ID: 'qa',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: 'qa@example.test',
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: 'qa',
  });
  const f = fixture(async () => {
    calls += 1;
    if (calls === 1) throw new Error('transient Sheets failure');
    delivered += 1;
  });
  try {
    f.db.prepare(`INSERT INTO delivery_outbox
      (event_key, kind, shop_id, payload, status, attempts, next_attempt_at, created_at)
      VALUES (?, ?, ?, ?, 'pending', 0, ?, ?)`)
      .run('sheet:sale:qa-id', 'sheet_sale', 'shop-a',
        JSON.stringify({ sale: { id: 'qa-id', code: 'QA' } }), Date.now(), Date.now());
    assert.equal(await f.newWorker().drainOnce(), 1);
    let state = f.db.prepare('SELECT status, attempts, next_attempt_at FROM delivery_outbox').get();
    assert.equal(state.status, 'pending');
    assert.equal(state.attempts, 1);
    assert.ok(state.next_attempt_at > Date.now());
    f.db.prepare('UPDATE delivery_outbox SET next_attempt_at = ?').run(Date.now() - 1);
    assert.equal(await f.newWorker().drainOnce(), 1);
    state = f.db.prepare('SELECT status, attempts FROM delivery_outbox').get();
    assert.equal(state.status, 'done');
    assert.equal(delivered, 1);
    assert.equal(await f.newWorker().drainOnce(), 0);
    assert.equal(delivered, 1);
  } finally {
    f.db.close();
    for (const [k,v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test('outbox never marks events done without configured credentials', async () => {
  const prev = process.env.GOOGLE_SHEET_ID;
  delete process.env.GOOGLE_SHEET_ID;
  const f = fixture(async () => { throw new Error('Should not try delivering'); });
  try {
    f.db.prepare(`INSERT INTO delivery_outbox
      (event_key, kind, shop_id, payload, status, attempts, next_attempt_at, created_at)
      VALUES (?, ?, ?, ?, 'pending', 0, ?, ?)`).run('sheet:sale:missing', 'sheet_sale',
      'shop-a', JSON.stringify({ sale: { id: 'missing' } }), Date.now(), Date.now());
    assert.equal(await f.newWorker().drainOnce(), 1);
    assert.equal(f.db.prepare('SELECT status FROM delivery_outbox').get().status, 'pending');
  } finally {
    f.db.close();
    if (prev === undefined) delete process.env.GOOGLE_SHEET_ID; else process.env.GOOGLE_SHEET_ID = prev;
  }
});

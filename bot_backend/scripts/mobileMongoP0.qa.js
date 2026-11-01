const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const { createMongoSale } = require('../services/mongoSaleWriter');
const Sale = require('../mongo/models/Sale');
const SaleItem = require('../mongo/models/SaleItem');
const Product = require('../mongo/models/Product');
const InventoryLog = require('../mongo/models/InventoryLog');
const CashFlow = require('../mongo/models/CashFlow');

(async () => {
  const uri = process.env.QA_MONGO_URI;
  assert.ok(uri, 'Isolated QA_MONGO_URI must be provided');
  await mongoose.connect(uri, { dbName: 'pos_qa_' + randomUUID().replace(/-/g, '') });
  try {
    await Promise.all([Sale.init(), SaleItem.init(), Product.init(), InventoryLog.init(), CashFlow.init()]);
    const shop = randomUUID(), productId = randomUUID();
    await Product.create({ id: productId, shop_id: shop, barcode: 'A', name: 'A', price: 100, stock_quantity: 100 });
    const payload = (id, qty = 1) => ({
      id, code: id, total_amount: qty * 100, payment_method: 'cash',
      items: [{ product_id: productId, product_name: 'A', price: 100, quantity: qty }]
    });
    // Fail AFTER writing sale header + lines, BEFORE cashbook: transaction rolls everything back.
    const firstId = randomUUID();
    let failureInjected = false;
    const original = CashFlow.create;
    CashFlow.create = async () => { failureInjected = true; throw new Error('QA crash before cashbook'); };
    try {
      await assert.rejects(createMongoSale(shop, null, payload(firstId, 2)), /QA crash/);
    } finally { CashFlow.create = original; }
    assert.equal(failureInjected, true);
    assert.equal(await Sale.countDocuments({ id: firstId }), 0);
    assert.equal(await SaleItem.countDocuments({ sale_id: firstId }), 0);
    assert.equal(await InventoryLog.countDocuments({ shop_id: shop }), 0);
    assert.equal((await Product.findOne({ id: productId })).stock_quantity, 100);
    assert.equal(await CashFlow.countDocuments({ shop_id: shop }), 0);
    await createMongoSale(shop, null, payload(firstId, 2));
    await createMongoSale(shop, null, payload(firstId, 2));
    assert.equal((await Product.findOne({ id: productId })).stock_quantity, 98);
    assert.equal(await CashFlow.countDocuments({ ref_id: firstId }), 1);

    // Concurrent independent purchases must not lose stock updates.
    const independent = Array.from({ length: 10 }, () => payload(randomUUID(), 1));
    const outcomes = await Promise.allSettled(independent.map(s => createMongoSale(shop, null, s)));
    const success = outcomes.filter(r => r.status === 'fulfilled').length;
    // Mongo transaction write conflicts may require caller retries. Retrying same id is safe.
    for (let i = 0; i < independent.length; i++) {
      if (outcomes[i].status === 'rejected') await createMongoSale(shop, null, independent[i]);
    }
    assert.equal(success + outcomes.filter(r => r.status === 'rejected').length, 10);
    assert.equal((await Product.findOne({ id: productId })).stock_quantity, 88);
    assert.equal(await Sale.countDocuments({ shop_id: shop }), 11);
    assert.equal(await SaleItem.countDocuments({ sale_id: { $in: independent.map(x => x.id) } }), 10);
    assert.equal(await CashFlow.countDocuments({ shop_id: shop }), 11);

    // Dual mode: Mongo commits, SQLite fails. Retry must repair the missing mirror.
    const Database = require('better-sqlite3');
    const fs = require('node:fs');
    const path = require('node:path');
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(fs.readFileSync(path.resolve(__dirname, '../db/init.sql'), 'utf8'));
    db.prepare('INSERT INTO shops (id, name) VALUES (?, ?)').run(shop, 'QA Dual');
    const repoSource = fs.readFileSync(path.resolve(__dirname, '../repositories/sales.repo.js'), 'utf8');
    const container = { exports: {} };
    const dependencies = {
      uuid: { v4: randomUUID }, '../db/connection': db,
      '../db/provider': { getDbProvider: () => 'dual' },
      '../mongo/models/Sale': Sale, '../mongo/models/SaleItem': SaleItem,
      '../mongo/models/Product': Product,
      '../mongo/models/InventoryLog': InventoryLog,
      '../mongo/models/CashFlow': CashFlow,
      '../services/mongoSaleWriter': require('../services/mongoSaleWriter'),
      '../services/saleValidation': require('../services/saleValidation'),
    };
    new Function('require', 'module', 'exports', repoSource)(
      n => {
        if (!(n in dependencies)) throw new Error('Unexpected dependency ' + n);
        return dependencies[n];
      }, container, container.exports
    );
    const dual = container.exports.getSalesRepo();
    const dualId = randomUUID(), dualSale = payload(dualId, 1);
    const prepare = db.prepare.bind(db);
    let failCreate = true;
    db.prepare = function(sql) {
      if (failCreate && sql.includes('INSERT INTO sales (')) {
        failCreate = false; throw new Error('QA SQLite create unavailable');
      }
      return prepare(sql);
    };
    await assert.rejects(dual.createSale(shop, null, dualSale), /QA SQLite create unavailable/);
    db.prepare = prepare;
    assert.equal(await Sale.countDocuments({ id: dualId }), 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sales').get().n, 0);
    assert.equal(await dual.createSale(shop, null, dualSale), dualId);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sales').get().n, 1);
    assert.equal(await dual.createSale(shop, null, dualSale), dualId);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM cash_flows').get().n, 1);
    const dualStock = (await Product.findOne({ id: productId })).stock_quantity;
    assert.equal(dualStock, 87);
    let failVoid = true;
    db.prepare = function(sql) {
      if (failVoid && sql.includes('UPDATE sales SET is_void')) {
        failVoid = false; throw new Error('QA SQLite void unavailable');
      }
      return prepare(sql);
    };
    await assert.rejects(dual.voidSale(shop, dualId, 'QA fault'), /QA SQLite void unavailable/);
    db.prepare = prepare;
    assert.equal((await Sale.findOne({ id: dualId })).is_void, true);
    assert.equal(db.prepare('SELECT is_void FROM sales WHERE id = ?').get(dualId).is_void, 0);
    await dual.voidSale(shop, dualId, 'QA fault');
    assert.equal(db.prepare('SELECT is_void FROM sales WHERE id = ?').get(dualId).is_void, 1);
    assert.equal((await Product.findOne({ id: productId })).stock_quantity, 88);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM inventory_logs WHERE type = 'void'").get().n, 0);
    db.close();
    console.log('PASS Dual: recover create + void from injected SQLite write faults');

    console.log('PASS Mongo replica set: crash rollback, replay idempotency, 10 concurrent sales and stock integrity');
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
})().catch(e => { console.error('Mongo P0 QA failed', e); process.exitCode = 1; });

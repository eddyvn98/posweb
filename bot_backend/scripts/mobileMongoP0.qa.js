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
    console.log('PASS Mongo replica set: crash rollback, replay idempotency, 10 concurrent sales and stock integrity');
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
})().catch(e => { console.error('Mongo P0 QA failed', e); process.exitCode = 1; });

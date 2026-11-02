const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Sale = require('../mongo/models/Sale');
const SaleItem = require('../mongo/models/SaleItem');
const Product = require('../mongo/models/Product');
const InventoryLog = require('../mongo/models/InventoryLog');
const CashFlow = require('../mongo/models/CashFlow');
const { validateSale, assertReplayCompatible } = require('./saleValidation');
const { mongoEnqueue, saleEvents, voidEvent } = require('./deliveryOutbox');

// The Sale, its lines, stock movements and cashbook MUST commit as one unit.
// MongoDB must run as a replica set (including single-node replica sets).
async function createMongoSale(shop_id, user_id, sale, options = {}) {
  validateSale(sale, shop_id);
  const saleId = sale.id || uuidv4();
  const previous = await Sale.findOne({ id: saleId, shop_id }).lean();
  if (previous) {
    const lines = await SaleItem.find({ sale_id: saleId }).lean();
    assertReplayCompatible(previous, sale, lines);
    return options.withMeta ? { id: saleId, created: false } : saleId;
  }

  const session = await mongoose.startSession();
  let created = false;
  try {
    await session.withTransaction(async () => {
      created = false;
      const existing = await Sale.findOne({ id: saleId, shop_id }).session(session).lean();
      if (existing) {
        const lines = await SaleItem.find({ sale_id: saleId }).session(session).lean();
        assertReplayCompatible(existing, sale, lines);
        return;
      }

      await Sale.create([{
        id: saleId, shop_id, code: sale.code,
        total_amount: Number(sale.total_amount),
        payment_method: sale.payment_method,
        sale_date: sale.sale_date ? new Date(sale.sale_date) : new Date(),
        created_by: user_id,
      }], { session });

      for (const item of sale.items || []) {
        const qty = Number(item.quantity);
        const price = Number(item.price);
        if (!Number.isSafeInteger(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) {
          throw new Error('Invalid sale item quantity or price');
        }
        const product = item.product_id && !item.is_quick_sale
          ? await Product.findOne({ id: item.product_id, shop_id }).session(session).lean()
          : null;
        if (item.product_id && !product && !item.is_quick_sale) {
          throw Object.assign(new Error('Catalog product not found in this shop'), { status: 400 });
        }
        if (item.is_quick_sale && item.product_id &&
            await Product.findOne({ id: item.product_id, shop_id }).session(session).lean()) {
          throw Object.assign(new Error('Catalog items cannot bypass stock as quick sales'), { status: 400 });
        }
        await SaleItem.create([{
          id: uuidv4(), sale_id: saleId, product_id: product ? item.product_id : null,
          quantity: qty, price, product_name: item.product_name,
        }], { session });

        if (product) {
          // Atomic $inc avoids lost updates from two cashiers selling simultaneously.
          const updated = await Product.findOneAndUpdate(
            { id: product.id, shop_id },
            { $inc: { stock_quantity: -qty } },
            { new: true, session }
          ).lean();
          if (!updated) throw new Error('Product disappeared during sale');
          await InventoryLog.create([{
            id: uuidv4(), shop_id, product_id: product.id,
            change_amount: -qty, current_stock: updated.stock_quantity,
            type: 'sale', note: 'Ban hang',
            created_at: sale.sale_date ? new Date(sale.sale_date) : new Date(),
          }], { session });
        }
      }

      await CashFlow.create([{
        id: uuidv4(), shop_id, amount: Number(sale.total_amount || 0),
        type: 'in', category: 'sale',
        description: `Thu tien ban hang don ${sale.code}`, ref_id: saleId,
        created_at: sale.sale_date ? new Date(sale.sale_date) : new Date(),
      }], { session });
      for (const event of saleEvents(shop_id, { ...sale, id: saleId })) await mongoEnqueue(event, session);
      created = true;
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary',
    });
  } catch (error) {
    // Concurrent replays race on Sale.id's unique index. Only return success
    // if the original transaction committed, never for a partial write.
    if (error.code === 11000) {
      const committed = await Sale.findOne({ id: saleId, shop_id }).lean();
      if (committed) {
        const lines = await SaleItem.find({ sale_id: saleId }).lean();
        assertReplayCompatible(committed, sale, lines);
        return options.withMeta ? { id: saleId, created: false } : saleId;
      }
    }
    throw error;
  } finally {
    await session.endSession();
  }
  return options.withMeta ? { id: saleId, created } : saleId;
}


async function voidMongoSale(shop_id, saleId, reason, options = {}) {
  const session = await mongoose.startSession();
  let voided = false;
  try {
    await session.withTransaction(async () => {
      voided = false;
      const sale = await Sale.findOne({ id: saleId, shop_id }).session(session).lean();
      if (!sale) throw new Error('Sale not found');
      if (sale.is_void) {
        if (options.allowAlreadyVoided) return;
        throw new Error('Sale already voided');
      }
      await Sale.updateOne({ id: saleId, shop_id, is_void: false },
        { $set: { is_void: true, void_reason: reason, void_at: new Date() } }, { session });
      const items = await SaleItem.find({ sale_id: saleId }).session(session).lean();
      for (const item of items) {
        if (!item.product_id) continue;
        const updated = await Product.findOneAndUpdate(
          { id: item.product_id, shop_id },
          { $inc: { stock_quantity: Number(item.quantity) } },
          { new: true, session }
        ).lean();
        if (!updated) continue;
        await InventoryLog.create([{
          id: uuidv4(), shop_id, product_id: item.product_id,
          change_amount: Number(item.quantity), current_stock: updated.stock_quantity,
          type: 'void', note: `Huy don hang ${saleId}`, created_at: new Date(),
        }], { session });
      }
      const flows = await CashFlow.find({ ref_id: saleId, shop_id }).session(session).lean();
      for (const flow of flows) {
        await CashFlow.updateOne({ id: flow.id, shop_id },
          { $set: { description: `[VOIDED] ${flow.description}` } }, { session });
      }
      await mongoEnqueue(voidEvent(shop_id, saleId, reason), session);
      voided = true;
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally {
    await session.endSession();
  }
  return options.withMeta ? { voided } : true;
}

module.exports = { createMongoSale, voidMongoSale };

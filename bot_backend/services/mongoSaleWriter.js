const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Sale = require('../mongo/models/Sale');
const SaleItem = require('../mongo/models/SaleItem');
const Product = require('../mongo/models/Product');
const InventoryLog = require('../mongo/models/InventoryLog');
const CashFlow = require('../mongo/models/CashFlow');

// The Sale, its lines, stock movements and cashbook MUST commit as one unit.
// MongoDB must run as a replica set (including single-node replica sets).
async function createMongoSale(shop_id, user_id, sale, options = {}) {
  const saleId = sale.id || uuidv4();
  const previous = await Sale.findOne({ id: saleId, shop_id }).lean();
  if (previous) return options.withMeta ? { id: saleId, created: false } : saleId;

  const session = await mongoose.startSession();
  let created = false;
  try {
    await session.withTransaction(async () => {
      created = false;
      const existing = await Sale.findOne({ id: saleId, shop_id }).session(session).lean();
      if (existing) return;

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
      if (committed) return options.withMeta ? { id: saleId, created: false } : saleId;
    }
    throw error;
  } finally {
    await session.endSession();
  }
  return options.withMeta ? { id: saleId, created } : saleId;
}

module.exports = { createMongoSale };

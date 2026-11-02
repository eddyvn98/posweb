const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const Sale = require('../mongo/models/Sale');
const SaleItem = require('../mongo/models/SaleItem');
const Product = require('../mongo/models/Product');
const InventoryLog = require('../mongo/models/InventoryLog');
const CashFlow = require('../mongo/models/CashFlow');
const { createMongoSale, voidMongoSale } = require('../services/mongoSaleWriter');
const { validateSale, assertReplayCompatible } = require('../services/saleValidation');

const sqliteRepo = {
  async createSale(shop_id, user_id, sale, options = {}) {
    validateSale(sale, shop_id);
    const saleId = sale.id || uuidv4();
    // Client-generated sale.id is the idempotency key; code is display-only.
    // Preserve code matching only for legacy clients that do not send an id.
    const existing = sale.id
      ? db.prepare('SELECT * FROM sales WHERE id = ? AND shop_id = ?').get(saleId, shop_id)
      : db.prepare('SELECT * FROM sales WHERE code = ? AND shop_id = ?').get(sale.code, shop_id);
    if (existing) {
      const lines = db.prepare('SELECT product_id, product_name, price, quantity FROM sale_items WHERE sale_id = ?').all(existing.id);
      assertReplayCompatible(existing, sale, lines);
      return options.withMeta ? { id: existing.id, created: false } : existing.id;
    }
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO sales (id, shop_id, code, total_amount, payment_method, sale_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(saleId, shop_id, sale.code, sale.total_amount, sale.payment_method, sale.sale_date, user_id);

      if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
          const itemId = uuidv4();

          // An ad-hoc/removed/foreign-shop product is not an inventory item.
          // Keep its sale line but never fabricate a catalog record or negative stock.
          const product = item.product_id && !item.is_quick_sale
            ? db.prepare('SELECT id, stock_quantity FROM products WHERE id = ? AND shop_id = ?').get(item.product_id, shop_id)
            : null;
          if (item.product_id && !product && !item.is_quick_sale) {
            throw Object.assign(new Error('Catalog product not found in this shop'), { status: 400 });
          }
          if (item.is_quick_sale && item.product_id &&
              db.prepare('SELECT id FROM products WHERE id = ? AND shop_id = ?').get(item.product_id, shop_id)) {
            throw Object.assign(new Error('Catalog items cannot bypass stock as quick sales'), { status: 400 });
          }
          const linkedId = product ? item.product_id : null;
          db.prepare('INSERT INTO sale_items (id, sale_id, product_id, quantity, price, product_name) VALUES (?, ?, ?, ?, ?, ?)')
            .run(itemId, saleId, linkedId, item.quantity, item.price, item.product_name);

          if (product) {
            const newStock = Number(product.stock_quantity || 0) - Number(item.quantity || 0);
            db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ? AND shop_id = ?')
              .run(newStock, item.product_id, shop_id);
            db.prepare('INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)')
              .run(uuidv4(), shop_id, item.product_id, -Number(item.quantity || 0), newStock, 'sale', 'Ban hang');
          }
        }
      }

      db.prepare('INSERT INTO cash_flows (id, shop_id, amount, type, category, description, ref_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), shop_id, sale.total_amount, 'in', 'sale', `Thu tien ban hang don ${sale.code}`, saleId, sale.sale_date);

      return saleId;
    });

    const resultId = transaction();
    return options.withMeta ? { id: resultId, created: true } : resultId;
  },

  async getSales(shop_id, startDate, endDate) {
    const safeStartDate = startDate || '1970-01-01T00:00:00.000Z';
    const safeEndDate = endDate || '2999-12-31T23:59:59.999Z';
    const sales = db.prepare('SELECT * FROM sales WHERE shop_id = ? AND sale_date >= ? AND sale_date <= ? ORDER BY sale_date DESC').all(shop_id, safeStartDate, safeEndDate);
    if (!sales || sales.length === 0) return [];

    const saleIds = sales.map(s => s.id);
    const chunkSize = 500;
    const itemsBySale = {};
    for (let i = 0; i < saleIds.length; i += chunkSize) {
      const chunk = saleIds.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id IN (${placeholders})`).all(...chunk);
      for (const item of items) {
        if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
        itemsBySale[item.sale_id].push(item);
      }
    }

    for (const sale of sales) {
      sale.items = itemsBySale[sale.id] || [];
    }

    return sales;
  },

  async voidSale(shop_id, saleId, reason, options = {}) {
    const tx = db.transaction(() => {
      const sale = db.prepare('SELECT id, is_void FROM sales WHERE id = ? AND shop_id = ?').get(saleId, shop_id);
      if (!sale) throw new Error('Sale not found');
      if (sale.is_void) {
        if (options.allowAlreadyVoided) return false;
        throw new Error('Sale already voided');
      }

      db.prepare('UPDATE sales SET is_void = 1, void_reason = ?, void_at = ? WHERE id = ?').run(reason, new Date().toISOString(), saleId);

      const items = db.prepare('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?').all(saleId);
      for (const item of items) {
        if (!item.product_id) continue;

        const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ? AND shop_id = ?').get(item.product_id, shop_id);
        if (!product) continue;

        const newStock = product.stock_quantity + item.quantity;
        db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ? AND shop_id = ?').run(newStock, item.product_id, shop_id);
        db.prepare('INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), shop_id, item.product_id, item.quantity, newStock, 'void', `Huy don hang ${saleId}`);
      }

      db.prepare("UPDATE cash_flows SET description = '[VOIDED] ' || description WHERE ref_id = ?").run(saleId);
      return true;
    });

    const voided = tx();
    return options.withMeta ? { voided } : voided;
  },
};

const mongoRepo = {
  async createSale(shop_id, user_id, sale, options = {}) {
    return createMongoSale(shop_id, user_id, sale, options);
  },

  async getSales(shop_id, startDate, endDate) {
    const filter = { shop_id };
    if (startDate || endDate) {
      filter.sale_date = {};
      if (startDate) filter.sale_date.$gte = new Date(startDate);
      if (endDate) filter.sale_date.$lte = new Date(endDate);
    }
    const sales = await Sale.find(filter).sort({ sale_date: -1 }).lean();
    if (!sales || sales.length === 0) return [];
    const saleIds = sales.map(s => s.id);
    const items = await SaleItem.find({ sale_id: { $in: saleIds } }).lean();
    const itemsBySale = {};
    for (const item of items) {
      if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
      itemsBySale[item.sale_id].push(item);
    }
    for (const sale of sales) {
      sale.items = itemsBySale[sale.id] || [];
    }
    return sales;
  },

  async voidSale(shop_id, saleId, reason, options = {}) {
    return voidMongoSale(shop_id, saleId, reason, options);
  },


};

const dualRepo = {
  ...mongoRepo,
  async createSale(shop_id, user_id, sale, options = {}) {
    const mongo = await mongoRepo.createSale(shop_id, user_id, sale, { withMeta: true });
    // Mongo is the primary store. A failed SQLite mirror MUST be retryable.
    // Even if Mongo already has the sale, retry the missing SQLite mirror.
    const mirror = await sqliteRepo.createSale(
      shop_id, user_id, { ...sale, id: mongo.id }, { withMeta: true }
    );
    const outcome = { id: mongo.id, created: mongo.created || mirror.created };
    return options.withMeta ? outcome : outcome.id;
  },
  async voidSale(shop_id, saleId, reason, options = {}) {
    const mongo = await mongoRepo.voidSale(shop_id, saleId, reason,
      { withMeta: true, allowAlreadyVoided: true });
    // Do not acknowledge until the SQLite mirror is also voided.
    // A retry can finish SQLite after Mongo has already committed.
    const mirror = await sqliteRepo.voidSale(shop_id, saleId, reason,
      { withMeta: true, allowAlreadyVoided: true });
    const result = { voided: mongo.voided || mirror.voided };
    return options.withMeta ? result : true;
  },
};

function getSalesRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo') return mongoRepo;
  if (provider === 'dual') return dualRepo;
  return sqliteRepo;
}

module.exports = { getSalesRepo };

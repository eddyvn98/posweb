const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const { getTenantModel } = require('../db/tenantManager');
const SaleSchema = require('../mongo/models/Sale');
const SaleItemSchema = require('../mongo/models/SaleItem');
const ProductSchema = require('../mongo/models/Product');
const InventoryLogSchema = require('../mongo/models/InventoryLog');
const CashFlowSchema = require('../mongo/models/CashFlow');

const sqliteRepo = {
  async createSale(shop_id, user_id, sale) {
    const transaction = db.transaction(() => {
      const saleId = sale.id || uuidv4();
      db.prepare('INSERT INTO sales (id, shop_id, code, total_amount, payment_method, sale_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(saleId, shop_id, sale.code, sale.total_amount, sale.payment_method, sale.sale_date, user_id);

      if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
          const itemId = uuidv4();
          db.prepare('INSERT INTO sale_items (id, sale_id, product_id, quantity, price, product_name) VALUES (?, ?, ?, ?, ?, ?)')
            .run(itemId, saleId, item.product_id || null, item.quantity, item.price, item.product_name);

          if (item.product_id) {
            const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.product_id);
            const currentStock = product ? product.stock_quantity : 0;
            const newStock = currentStock - item.quantity;
            db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newStock, item.product_id);

            db.prepare('INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)')
              .run(uuidv4(), shop_id, item.product_id, -item.quantity, newStock, 'sale', 'Ban hang');
          }
        }
      }

      db.prepare('INSERT INTO cash_flows (id, shop_id, amount, type, category, description, ref_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), shop_id, sale.total_amount, 'in', 'sale', `Thu tien ban hang don ${sale.code}`, saleId, sale.sale_date);

      return saleId;
    });

    return transaction();
  },

  async getSales(shop_id, startDate, endDate) {
    const safeStartDate = startDate || '1970-01-01T00:00:00.000Z';
    const safeEndDate = endDate || '2999-12-31T23:59:59.999Z';
    return db.prepare('SELECT * FROM sales WHERE shop_id = ? AND sale_date >= ? AND sale_date <= ? ORDER BY sale_date ASC').all(shop_id, safeStartDate, safeEndDate);
  },

  async voidSale(shop_id, saleId, reason) {
    const tx = db.transaction(() => {
      const sale = db.prepare('SELECT id, is_void FROM sales WHERE id = ? AND shop_id = ?').get(saleId, shop_id);
      if (!sale) throw new Error('Sale not found');
      if (sale.is_void) throw new Error('Sale already voided');

      db.prepare('UPDATE sales SET is_void = 1, void_reason = ?, void_at = ? WHERE id = ?').run(reason, new Date().toISOString(), saleId);

      const items = db.prepare('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?').all(saleId);
      for (const item of items) {
        if (!item.product_id) continue;

        const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.product_id);
        if (!product) continue;

        const newStock = product.stock_quantity + item.quantity;
        db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newStock, item.product_id);
        db.prepare('INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), shop_id, item.product_id, item.quantity, newStock, 'void', `Huy don hang ${saleId}`);
      }

      db.prepare("UPDATE cash_flows SET description = '[VOIDED] ' || description WHERE ref_id = ?").run(saleId);
      return true;
    });

    return tx();
  },
};

const mongoRepo = {
  async createSale(shop_id, user_id, sale) {
    const Sale = getTenantModel(shop_id, 'Sale', SaleSchema);
    const SaleItem = getTenantModel(shop_id, 'SaleItem', SaleItemSchema);
    const Product = getTenantModel(shop_id, 'Product', ProductSchema);
    const InventoryLog = getTenantModel(shop_id, 'InventoryLog', InventoryLogSchema);
    const CashFlow = getTenantModel(shop_id, 'CashFlow', CashFlowSchema);

    const saleId = sale.id || uuidv4();
    await Sale.create({
      id: saleId,
      shop_id,
      code: sale.code,
      total_amount: sale.total_amount,
      payment_method: sale.payment_method,
      sale_date: sale.sale_date ? new Date(sale.sale_date) : new Date(),
      created_by: user_id,
    });

    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        await SaleItem.create({
          id: uuidv4(),
          sale_id: saleId,
          product_id: item.product_id || null,
          quantity: item.quantity,
          price: item.price,
          product_name: item.product_name,
        });

        if (item.product_id) {
          const product = await Product.findOne({ id: item.product_id, shop_id });
          const currentStock = product ? Number(product.stock_quantity || 0) : 0;
          const newStock = currentStock - Number(item.quantity || 0);
          await Product.updateOne({ id: item.product_id, shop_id }, { $set: { stock_quantity: newStock } });

          await InventoryLog.create({
            id: uuidv4(),
            shop_id,
            product_id: item.product_id,
            change_amount: -Number(item.quantity || 0),
            current_stock: newStock,
            type: 'sale',
            note: 'Ban hang',
            created_at: sale.sale_date ? new Date(sale.sale_date) : new Date(),
          });
        }
      }
    }

    await CashFlow.create({
      id: uuidv4(),
      shop_id,
      amount: Number(sale.total_amount || 0),
      type: 'in',
      category: 'sale',
      description: `Thu tien ban hang don ${sale.code}`,
      ref_id: saleId,
      created_at: sale.sale_date ? new Date(sale.sale_date) : new Date(),
    });

    return saleId;
  },

  async getSales(shop_id, startDate, endDate) {
    const Sale = getTenantModel(shop_id, 'Sale', SaleSchema);
    const filter = { shop_id };
    if (startDate || endDate) {
      filter.sale_date = {};
      if (startDate) filter.sale_date.$gte = new Date(startDate);
      if (endDate) filter.sale_date.$lte = new Date(endDate);
    }
    return Sale.find(filter).sort({ sale_date: 1 }).lean();
  },

  async voidSale(shop_id, saleId, reason) {
    const Sale = getTenantModel(shop_id, 'Sale', SaleSchema);
    const SaleItem = getTenantModel(shop_id, 'SaleItem', SaleItemSchema);
    const Product = getTenantModel(shop_id, 'Product', ProductSchema);
    const InventoryLog = getTenantModel(shop_id, 'InventoryLog', InventoryLogSchema);
    const CashFlow = getTenantModel(shop_id, 'CashFlow', CashFlowSchema);

    const sale = await Sale.findOne({ id: saleId, shop_id });
    if (!sale) throw new Error('Sale not found');
    if (sale.is_void) throw new Error('Sale already voided');

    await Sale.updateOne({ id: saleId, shop_id }, { $set: { is_void: true, void_reason: reason, void_at: new Date() } });

    const items = await SaleItem.find({ sale_id: saleId }).lean();
    for (const item of items) {
      if (!item.product_id) continue;
      const product = await Product.findOne({ id: item.product_id, shop_id });
      if (!product) continue;
      const newStock = Number(product.stock_quantity || 0) + Number(item.quantity || 0);
      await Product.updateOne({ id: item.product_id, shop_id }, { $set: { stock_quantity: newStock } });
      await InventoryLog.create({
        id: uuidv4(),
        shop_id,
        product_id: item.product_id,
        change_amount: Number(item.quantity || 0),
        current_stock: newStock,
        type: 'void',
        note: `Huy don hang ${saleId}`,
        created_at: new Date(),
      });
    }

    const flows = await CashFlow.find({ ref_id: saleId, shop_id }).lean();
    for (const flow of flows) {
      await CashFlow.updateOne({ id: flow.id }, { $set: { description: `[VOIDED] ${flow.description}` } });
    }
    return true;
  },
};

const dualRepo = {
  ...mongoRepo,
  async createSale(shop_id, user_id, sale) {
    const saleId = await mongoRepo.createSale(shop_id, user_id, sale);
    try {
      await sqliteRepo.createSale(shop_id, user_id, { ...sale, id: saleId });
    } catch (e) {
      console.error('[dual][sales] sqlite write failed:', e.message);
    }
    return saleId;
  },
  async voidSale(shop_id, saleId, reason) {
    const ok = await mongoRepo.voidSale(shop_id, saleId, reason);
    try {
      await sqliteRepo.voidSale(shop_id, saleId, reason);
    } catch (e) {
      console.error('[dual][sales] sqlite write failed:', e.message);
    }
    return ok;
  },
};

function getSalesRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo') return mongoRepo;
  if (provider === 'dual') return dualRepo;
  return sqliteRepo;
}

module.exports = { getSalesRepo };

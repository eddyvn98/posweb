require('dotenv').config();

const mongoose = require('mongoose');
const db = require('../db/connection');
const { connectMongo } = require('../db/mongo');

const Shop = require('../mongo/models/Shop');
const User = require('../mongo/models/User');
const Unit = require('../mongo/models/Unit');
const Category = require('../mongo/models/Category');
const Product = require('../mongo/models/Product');
const Sale = require('../mongo/models/Sale');
const SaleItem = require('../mongo/models/SaleItem');
const InventoryLog = require('../mongo/models/InventoryLog');
const CashFlow = require('../mongo/models/CashFlow');

function ts(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

(async () => {
  try {
    await connectMongo();

    const shops = await Shop.find({}).lean();
    const users = await User.find({}).lean();
    const units = await Unit.find({}).lean();
    const categories = await Category.find({}).lean();
    const products = await Product.find({}).lean();
    const sales = await Sale.find({}).lean();
    const saleItems = await SaleItem.find({}).lean();
    const inventoryLogs = await InventoryLog.find({}).lean();
    const cashFlows = await CashFlow.find({}).lean();
    const imports = await mongoose.connection.db.collection('imports').find({}).toArray();

    const syncTx = db.transaction(() => {
      db.pragma('foreign_keys = OFF');

      db.exec(`
        DELETE FROM sale_items;
        DELETE FROM inventory_logs;
        DELETE FROM cash_flows;
        DELETE FROM sales;
        DELETE FROM products;
        DELETE FROM units;
        DELETE FROM categories;
        DELETE FROM users;
        DELETE FROM imports;
        DELETE FROM shops;
      `);

      const insertShop = db.prepare('INSERT INTO shops (id, name, address, updated_at, created_at) VALUES (?, ?, ?, ?, ?)');
      for (const s of shops) insertShop.run(s.id, s.name, s.address || null, ts(s.updated_at), ts(s.created_at));

      const insertUser = db.prepare('INSERT INTO users (id, shop_id, email, password, role, telegram_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const u of users) insertUser.run(u.id, u.shop_id, u.email, u.password || null, u.role || 'owner', u.telegram_id || null, ts(u.created_at));

      const insertUnit = db.prepare('INSERT INTO units (id, shop_id, name, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
      for (const x of units) insertUnit.run(x.id, x.shop_id, x.name, x.is_active ? 1 : 0, ts(x.created_at), ts(x.updated_at));

      const insertCategory = db.prepare('INSERT INTO categories (id, shop_id, name, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
      for (const x of categories) insertCategory.run(x.id, x.shop_id, x.name, x.is_active ? 1 : 0, ts(x.created_at), ts(x.updated_at));

      const insertProduct = db.prepare('INSERT INTO products (id, shop_id, barcode, name, unit, category, price, cost_price, stock_quantity, image_url, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const p of products) insertProduct.run(p.id, p.shop_id, p.barcode, p.name, p.unit || 'Cai', p.category || null, Number(p.price || 0), Number(p.cost_price || 0), Number(p.stock_quantity || 0), p.image_url || null, p.is_active ? 1 : 0, ts(p.created_at));

      const insertSale = db.prepare('INSERT INTO sales (id, shop_id, code, total_amount, payment_method, sale_date, created_by, is_void, void_reason, void_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const s of sales) insertSale.run(s.id, s.shop_id, s.code, Number(s.total_amount || 0), s.payment_method || 'cash', ts(s.sale_date), s.created_by || null, s.is_void ? 1 : 0, s.void_reason || null, ts(s.void_at));

      const insertSaleItem = db.prepare('INSERT INTO sale_items (id, sale_id, product_id, quantity, price, product_name) VALUES (?, ?, ?, ?, ?, ?)');
      for (const i of saleItems) insertSaleItem.run(i.id, i.sale_id, i.product_id || null, Number(i.quantity || 0), Number(i.price || 0), i.product_name || '');

      const insertInventory = db.prepare('INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const i of inventoryLogs) insertInventory.run(i.id, i.shop_id, i.product_id || null, Number(i.change_amount || 0), Number(i.current_stock || 0), i.type, i.note || null, ts(i.created_at));

      const insertCash = db.prepare('INSERT INTO cash_flows (id, shop_id, amount, type, category, description, ref_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const c of cashFlows) insertCash.run(c.id, c.shop_id, Number(c.amount || 0), c.type, c.category || 'sale', c.description || '', c.ref_id || null, ts(c.created_at));

      const insertImport = db.prepare('INSERT INTO imports (id, shop_id, import_date, supplier_name, total_cost, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const im of imports) insertImport.run(im.id, im.shop_id, im.import_date, im.supplier_name, Number(im.total_cost || 0), im.note || null, ts(im.created_at));

      db.pragma('foreign_keys = ON');
    });

    syncTx();

    console.log('[sync] sqlite refreshed from mongo');
    console.log(`[sync] shops=${shops.length}, users=${users.length}, units=${units.length}, categories=${categories.length}, products=${products.length}, sales=${sales.length}`);
    process.exit(0);
  } catch (error) {
    console.error('[sync] failed:', error);
    process.exit(1);
  }
})();

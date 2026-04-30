const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const Shop = require('../mongo/models/Shop');
const Category = require('../mongo/models/Category');
const Product = require('../mongo/models/Product');

const sqliteRepo = {
  async getCategories(shop_id) {
    return db.prepare('SELECT * FROM categories WHERE shop_id = ? ORDER BY name ASC').all(shop_id);
  },
  async createCategory(shop_id, name) {
    const id = uuidv4();
    db.prepare('INSERT INTO categories (id, shop_id, name) VALUES (?, ?, ?)').run(id, shop_id, name);
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },
  async updateCategory(shop_id, id, name) {
    const duplicate = db.prepare('SELECT id FROM categories WHERE shop_id = ? AND lower(name) = lower(?) AND id != ? LIMIT 1').get(shop_id, name, id);
    if (duplicate) throw new Error('CATEGORY_EXISTS');
    const result = db.prepare('UPDATE categories SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND shop_id = ?').run(name, id, shop_id);
    return result.changes > 0;
  },
  async deleteCategory(shop_id, id) {
    const category = db.prepare('SELECT name FROM categories WHERE id = ? AND shop_id = ?').get(id, shop_id);
    if (!category) throw new Error('Category not found');
    const inUse = db.prepare('SELECT id FROM products WHERE category = ? AND shop_id = ? LIMIT 1').get(category.name, shop_id);
    if (inUse) throw new Error('CATEGORY_IN_USE');
    db.prepare('DELETE FROM categories WHERE id = ? AND shop_id = ?').run(id, shop_id);
    return true;
  },
};

const mongoRepo = {
  async ensureShop(shop_id) {
    const shop = await Shop.findOne({ id: shop_id }).lean();
    if (!shop) await Shop.create({ id: shop_id, name: 'Cua hang' });
  },
  async getCategories(shop_id) {
    return Category.find({ shop_id }, null, { sort: { name: 1 } }).lean();
  },
  async createCategory(shop_id, name) {
    await this.ensureShop(shop_id);
    const exists = await Category.findOne({ shop_id, name: new RegExp(`^${name}$`, 'i') }).lean();
    if (exists) throw new Error('CATEGORY_EXISTS');
    const row = { id: uuidv4(), shop_id, name, is_active: true, created_at: new Date() };
    await Category.create(row);
    return row;
  },
  async updateCategory(shop_id, id, name) {
    const duplicate = await Category.findOne({ shop_id, id: { $ne: id }, name: new RegExp(`^${name}$`, 'i') }).lean();
    if (duplicate) throw new Error('CATEGORY_EXISTS');
    const result = await Category.updateOne({ id, shop_id }, { $set: { name, updated_at: new Date() } });
    return result.modifiedCount > 0;
  },
  async deleteCategory(shop_id, id) {
    const category = await Category.findOne({ id, shop_id }).lean();
    if (!category) throw new Error('Category not found');
    const inUse = await Product.findOne({ shop_id, category: category.name }).lean();
    if (inUse) throw new Error('CATEGORY_IN_USE');
    await Category.deleteOne({ id, shop_id });
    return true;
  },
};

const dualRepo = {
  ...mongoRepo,
  async createCategory(shop_id, name) {
    const row = await mongoRepo.createCategory(shop_id, name);
    try { await sqliteRepo.createCategory(shop_id, name); } catch (e) { console.error('[dual][categories] sqlite write failed:', e.message); }
    return row;
  },
  async updateCategory(shop_id, id, name) {
    const ok = await mongoRepo.updateCategory(shop_id, id, name);
    try { await sqliteRepo.updateCategory(shop_id, id, name); } catch (e) { console.error('[dual][categories] sqlite write failed:', e.message); }
    return ok;
  },
  async deleteCategory(shop_id, id) {
    const ok = await mongoRepo.deleteCategory(shop_id, id);
    try { await sqliteRepo.deleteCategory(shop_id, id); } catch (e) { console.error('[dual][categories] sqlite write failed:', e.message); }
    return ok;
  },
};

function getCategoriesRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo') return mongoRepo;
  if (provider === 'dual') return dualRepo;
  return sqliteRepo;
}

module.exports = { getCategoriesRepo };

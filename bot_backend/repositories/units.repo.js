const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const Shop = require('../mongo/models/Shop');
const Unit = require('../mongo/models/Unit');
const Product = require('../mongo/models/Product');

const DEFAULT_UNITS = ['Cái', 'H?p', 'Kg', 'Lon', 'Chai'];

const sqliteRepo = {
  async getUnits(shop_id) {
    let units = db.prepare('SELECT id, name FROM units WHERE shop_id = ? AND is_active = 1 ORDER BY name COLLATE NOCASE ASC').all(shop_id);
    if (units.length === 0) {
      const shop = db.prepare('SELECT id FROM shops WHERE id = ?').get(shop_id);
      if (!shop) db.prepare('INSERT OR IGNORE INTO shops (id, name) VALUES (?, ?)').run(shop_id, 'Cua hang');
      const insertStmt = db.prepare('INSERT OR IGNORE INTO units (id, shop_id, name, is_active) VALUES (?, ?, ?, 1)');
      for (const unitName of DEFAULT_UNITS) insertStmt.run(uuidv4(), shop_id, unitName);
      units = db.prepare('SELECT id, name FROM units WHERE shop_id = ? AND is_active = 1 ORDER BY name COLLATE NOCASE ASC').all(shop_id);
    }
    return units;
  },
  async createUnit(shop_id, name) {
    const exists = db.prepare('SELECT id FROM units WHERE shop_id = ? AND lower(name) = lower(?) AND is_active = 1 LIMIT 1').get(shop_id, name);
    if (exists) throw new Error('Unit already exists');
    const row = { id: uuidv4(), shop_id, name };
    db.prepare('INSERT INTO units (id, shop_id, name, is_active) VALUES (@id, @shop_id, @name, 1)').run(row);
    return row;
  },
  async updateUnit(shop_id, id, name) {
    const duplicate = db.prepare('SELECT id FROM units WHERE shop_id = ? AND lower(name) = lower(?) AND id != ? AND is_active = 1 LIMIT 1').get(shop_id, name, id);
    if (duplicate) throw new Error('Unit already exists');
    const result = db.prepare('UPDATE units SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND shop_id = ? AND is_active = 1').run(name, id, shop_id);
    return result.changes > 0;
  },
  async deleteUnit(shop_id, id) {
    const unit = db.prepare('SELECT name FROM units WHERE id = ? AND shop_id = ?').get(id, shop_id);
    if (!unit) throw new Error('Unit not found');
    const inUse = db.prepare('SELECT id FROM products WHERE unit = ? AND shop_id = ? LIMIT 1').get(unit.name, shop_id);
    if (inUse) throw new Error('UNIT_IN_USE');
    db.prepare('DELETE FROM units WHERE id = ? AND shop_id = ?').run(id, shop_id);
    return true;
  },
};

const mongoRepo = {
  async ensureShop(shop_id) {
    const shop = await Shop.findOne({ id: shop_id }).lean();
    if (!shop) await Shop.create({ id: shop_id, name: 'Cua hang' });
  },
  async getUnits(shop_id) {
    await this.ensureShop(shop_id);
    let units = await Unit.find({ shop_id, is_active: true }, { _id: 0, id: 1, name: 1 }).sort({ name: 1 }).lean();
    if (units.length === 0) {
      await Unit.insertMany(DEFAULT_UNITS.map((name) => ({ id: uuidv4(), shop_id, name, is_active: true })));
      units = await Unit.find({ shop_id, is_active: true }, { _id: 0, id: 1, name: 1 }).sort({ name: 1 }).lean();
    }
    return units;
  },
  async createUnit(shop_id, name) {
    await this.ensureShop(shop_id);
    const exists = await Unit.findOne({ shop_id, name: new RegExp(`^${name}$`, 'i'), is_active: true }).lean();
    if (exists) throw new Error('Unit already exists');
    const row = { id: uuidv4(), shop_id, name, is_active: true };
    await Unit.create(row);
    return { id: row.id, shop_id, name };
  },
  async updateUnit(shop_id, id, name) {
    const duplicate = await Unit.findOne({ shop_id, id: { $ne: id }, name: new RegExp(`^${name}$`, 'i'), is_active: true }).lean();
    if (duplicate) throw new Error('Unit already exists');
    const result = await Unit.updateOne({ id, shop_id, is_active: true }, { $set: { name, updated_at: new Date() } });
    return result.modifiedCount > 0;
  },
  async deleteUnit(shop_id, id) {
    const unit = await Unit.findOne({ id, shop_id }).lean();
    if (!unit) throw new Error('Unit not found');
    const inUse = await Product.findOne({ shop_id, unit: unit.name }).lean();
    if (inUse) throw new Error('UNIT_IN_USE');
    await Unit.deleteOne({ id, shop_id });
    return true;
  },
};

const dualRepo = {
  ...mongoRepo,
  async createUnit(shop_id, name) {
    const row = await mongoRepo.createUnit(shop_id, name);
    try { await sqliteRepo.createUnit(shop_id, name); } catch (e) { console.error('[dual][units] sqlite write failed:', e.message); }
    return row;
  },
  async updateUnit(shop_id, id, name) {
    const ok = await mongoRepo.updateUnit(shop_id, id, name);
    try { await sqliteRepo.updateUnit(shop_id, id, name); } catch (e) { console.error('[dual][units] sqlite write failed:', e.message); }
    return ok;
  },
  async deleteUnit(shop_id, id) {
    const ok = await mongoRepo.deleteUnit(shop_id, id);
    try { await sqliteRepo.deleteUnit(shop_id, id); } catch (e) { console.error('[dual][units] sqlite write failed:', e.message); }
    return ok;
  },
};

function getUnitsRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo') return mongoRepo;
  if (provider === 'dual') return dualRepo;
  return sqliteRepo;
}

module.exports = { getUnitsRepo };

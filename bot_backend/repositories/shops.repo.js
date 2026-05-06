const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const Shop = require('../mongo/models/Shop');

const sqliteRepo = {
  async getById(id) {
    return db.prepare('SELECT * FROM shops WHERE id = ?').get(id) || null;
  },
  async updateImportsSheet(shopId, sheetId, sheetUrl) {
    const result = db
      .prepare('UPDATE shops SET imports_sheet_id = ?, imports_sheet_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(sheetId, sheetUrl, shopId);
    return result.changes > 0;
  },
};

const mongoRepo = {
  async getById(id) {
    return Shop.findOne({ id }).lean();
  },
  async updateImportsSheet(shopId, sheetId, sheetUrl) {
    const result = await Shop.updateOne(
      { id: shopId },
      { $set: { imports_sheet_id: sheetId, imports_sheet_url: sheetUrl, updated_at: new Date() } }
    );
    return result.modifiedCount > 0;
  },
};

const dualRepo = {
  async getById(id) {
    return mongoRepo.getById(id);
  },
  async updateImportsSheet(shopId, sheetId, sheetUrl) {
    const ok = await mongoRepo.updateImportsSheet(shopId, sheetId, sheetUrl);
    try {
      await sqliteRepo.updateImportsSheet(shopId, sheetId, sheetUrl);
    } catch (e) {
      console.error('[dual][shops] sqlite write failed:', e.message);
    }
    return ok;
  },
};

function getShopsRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo') return mongoRepo;
  if (provider === 'dual') return dualRepo;
  return sqliteRepo;
}

module.exports = { getShopsRepo };

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const InviteCode = require('../mongo/models/InviteCode');
const User = require('../mongo/models/User');

const INVITE_CODE_TTL_DAYS = 7;

function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 hex chars
}

function expiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_CODE_TTL_DAYS);
  return d;
}

// ─── SQLite ───────────────────────────────────────────────────────────────────

const sqliteRepo = {
  async getStaffByShop(shop_id) {
    return db.prepare(
      "SELECT id, email, role, created_at FROM users WHERE shop_id = ? ORDER BY created_at ASC"
    ).all(shop_id);
  },

  async createInviteCode(shop_id, created_by) {
    const code = generateCode();
    const id = uuidv4();
    const expires = expiresAt().toISOString();
    db.prepare(
      'INSERT INTO invite_codes (id, shop_id, code, created_by, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, shop_id, code, created_by, expires);
    return { id, shop_id, code, expires_at: expires };
  },

  async getActiveInviteCodesByShop(shop_id) {
    return db.prepare(
      "SELECT * FROM invite_codes WHERE shop_id = ? AND is_used = 0 AND expires_at > datetime('now') ORDER BY created_at DESC"
    ).all(shop_id);
  },

  async validateInviteCode(code) {
    const row = db.prepare(
      "SELECT * FROM invite_codes WHERE code = ? AND is_used = 0 AND expires_at > datetime('now')"
    ).get(code);
    return row || null;
  },

  async markInviteCodeUsed(code, user_id) {
    db.prepare(
      "UPDATE invite_codes SET is_used = 1, used_by = ? WHERE code = ?"
    ).run(user_id, code);
  },

  async deleteStaff(shop_id, user_id) {
    const result = db.prepare(
      "DELETE FROM users WHERE id = ? AND shop_id = ? AND role = 'staff'"
    ).run(user_id, shop_id);
    return result.changes > 0;
  },

  async deleteInviteCode(shop_id, code_id) {
    const result = db.prepare(
      'DELETE FROM invite_codes WHERE id = ? AND shop_id = ?'
    ).run(code_id, shop_id);
    return result.changes > 0;
  },
};

// ─── MongoDB ──────────────────────────────────────────────────────────────────

const mongoRepo = {
  async getStaffByShop(shop_id) {
    return User.find({ shop_id }, { id: 1, email: 1, role: 1, created_at: 1, _id: 0 })
      .sort({ created_at: 1 })
      .lean();
  },

  async createInviteCode(shop_id, created_by) {
    const code = generateCode();
    const id = uuidv4();
    const expires = expiresAt();
    await InviteCode.create({ id, shop_id, code, created_by, expires_at: expires });
    return { id, shop_id, code, expires_at: expires.toISOString() };
  },

  async getActiveInviteCodesByShop(shop_id) {
    return InviteCode.find({
      shop_id,
      is_used: false,
      expires_at: { $gt: new Date() },
    }).sort({ created_at: -1 }).lean();
  },

  async validateInviteCode(code) {
    return InviteCode.findOne({
      code,
      is_used: false,
      expires_at: { $gt: new Date() },
    }).lean();
  },

  async markInviteCodeUsed(code, user_id) {
    await InviteCode.updateOne({ code }, { $set: { is_used: true, used_by: user_id } });
  },

  async deleteStaff(shop_id, user_id) {
    const result = await User.deleteOne({ id: user_id, shop_id, role: 'staff' });
    return result.deletedCount > 0;
  },

  async deleteInviteCode(shop_id, code_id) {
    const result = await InviteCode.deleteOne({ id: code_id, shop_id });
    return result.deletedCount > 0;
  },
};

// ─── Selector ─────────────────────────────────────────────────────────────────

function getStaffRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo' || provider === 'dual') return mongoRepo;
  return sqliteRepo;
}

module.exports = { getStaffRepo };

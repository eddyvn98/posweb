const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');

const Shop = require('../mongo/models/Shop');
const User = require('../mongo/models/User');

function normalizeUser(row) {
  if (!row) return null;
  return {
    ...row,
    created_at: row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 19) : row.created_at,
  };
}

function toSqlTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

const sqliteRepo = {
  async getShopById(id) {
    return db.prepare('SELECT * FROM shops WHERE id = ?').get(id) || null;
  },
  async getShopByName(name) {
    return db.prepare('SELECT * FROM shops WHERE name = ?').get(name) || null;
  },
  async getOwnerTelegramId() {
    const owner = db.prepare("SELECT telegram_id FROM users WHERE role = 'owner' LIMIT 1").get();
    return owner ? owner.telegram_id : null;
  },
  async getOrCreateUserFromTelegram(telegramUser, shopName) {
    const telegramId = telegramUser.id.toString();
    let user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
    if (!user) {
      const shopId = uuidv4();
      db.prepare('INSERT INTO shops (id, name) VALUES (?, ?)').run(shopId, shopName);
      const userId = uuidv4();
      const email = `${telegramId}@telegram.posweb.com`;
      db.prepare('INSERT INTO users (id, shop_id, email, role, telegram_id) VALUES (?, ?, ?, ? ,?)')
        .run(userId, shopId, email, 'owner', telegramId);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }
    return user;
  },
  async registerWithEmail(email, password, shopName) {
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) throw new Error('Email da ton tai trong he thong');

    const shopId = uuidv4();
    db.prepare('INSERT INTO shops (id, name) VALUES (?, ?)').run(shopId, shopName);

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare("INSERT INTO users (id, shop_id, email, password, role) VALUES (?, ?, ?, ?, 'owner')")
      .run(userId, shopId, email, passwordHash);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  },
  async loginWithEmail(email, password) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !user.password) throw new Error('Email hoac mat khau khong chinh xac');
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) throw new Error('Email hoac mat khau khong chinh xac');
    return user;
  },
  async getUserById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  },
  async updateUserPassword(userId, newHash) {
    const result = db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHash, userId);
    return result.changes > 0;
  },
  async updateShop(shopId, name, address) {
    const result = db.prepare('UPDATE shops SET name = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, address, shopId);
    return result.changes > 0;
  },
  async upsertShop(shop) {
    db.prepare(`
      INSERT INTO shops (id, name, address, updated_at, created_at)
      VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        address = excluded.address,
        updated_at = excluded.updated_at
    `).run(
      shop.id,
      shop.name,
      shop.address || null,
      toSqlTimestamp(shop.updated_at),
      toSqlTimestamp(shop.created_at)
    );
    return true;
  },
  async upsertUser(user) {
    db.prepare('DELETE FROM users WHERE email = ? AND id != ?').run(user.email, user.id);
    if (user.telegram_id) {
      db.prepare('DELETE FROM users WHERE telegram_id = ? AND id != ?').run(user.telegram_id, user.id);
    }

    db.prepare(`
      INSERT INTO users (id, shop_id, email, password, role, telegram_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      ON CONFLICT(id) DO UPDATE SET
        shop_id = excluded.shop_id,
        email = excluded.email,
        password = excluded.password,
        role = excluded.role,
        telegram_id = excluded.telegram_id
    `).run(
      user.id,
      user.shop_id,
      user.email,
      user.password || null,
      user.role || 'owner',
      user.telegram_id || null,
      toSqlTimestamp(user.created_at)
    );

    return true;
  },
};

const mongoRepo = {
  async getShopById(id) {
    return Shop.findOne({ id }).lean();
  },
  async getShopByName(name) {
    return Shop.findOne({ name }).lean();
  },
  async getOwnerTelegramId() {
    const owner = await User.findOne({ role: 'owner', telegram_id: { $ne: null } }).lean();
    return owner ? owner.telegram_id : null;
  },
  async getOrCreateUserFromTelegram(telegramUser, shopName) {
    const telegramId = telegramUser.id.toString();
    let user = await User.findOne({ telegram_id: telegramId }).lean();
    if (!user) {
      const shopId = uuidv4();
      await Shop.create({ id: shopId, name: shopName });
      const userId = uuidv4();
      const email = `${telegramId}@telegram.posweb.com`;
      await User.create({ id: userId, shop_id: shopId, email, role: 'owner', telegram_id: telegramId });
      user = await User.findOne({ id: userId }).lean();
    }
    return normalizeUser(user);
  },
  async registerWithEmail(email, password, shopName) {
    const existing = await User.findOne({ email }).lean();
    if (existing) throw new Error('Email da ton tai trong he thong');

    const shopId = uuidv4();
    await Shop.create({ id: shopId, name: shopName });

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    await User.create({ id: userId, shop_id: shopId, email, password: passwordHash, role: 'owner' });
    return normalizeUser(await User.findOne({ id: userId }).lean());
  },
  async loginWithEmail(email, password) {
    const user = await User.findOne({ email }).lean();
    if (!user || !user.password) throw new Error('Email hoac mat khau khong chinh xac');
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) throw new Error('Email hoac mat khau khong chinh xac');
    return normalizeUser(user);
  },
  async getUserById(id) {
    return normalizeUser(await User.findOne({ id }).lean());
  },
  async updateUserPassword(userId, newHash) {
    const result = await User.updateOne({ id: userId }, { $set: { password: newHash } });
    return result.modifiedCount > 0;
  },
  async updateShop(shopId, name, address) {
    const result = await Shop.updateOne({ id: shopId }, { $set: { name, address, updated_at: new Date() } });
    return result.modifiedCount > 0;
  },
};

const dualRepo = {
  ...mongoRepo,
  async getShopById(id) { return mongoRepo.getShopById(id); },
  async getShopByName(name) { return mongoRepo.getShopByName(name); },
  async getOwnerTelegramId() { return mongoRepo.getOwnerTelegramId(); },
  async getUserById(id) { return mongoRepo.getUserById(id); },
  async getOrCreateUserFromTelegram(telegramUser, shopName) {
    const user = await mongoRepo.getOrCreateUserFromTelegram(telegramUser, shopName);
    try {
      const shop = await mongoRepo.getShopById(user.shop_id);
      if (shop) await sqliteRepo.upsertShop(shop);
      await sqliteRepo.upsertUser(user);
    } catch (e) {
      console.error('[dual][auth] sqlite write failed:', e.message);
    }
    return user;
  },
  async registerWithEmail(email, password, shopName) {
    const user = await mongoRepo.registerWithEmail(email, password, shopName);
    try {
      const shop = await mongoRepo.getShopById(user.shop_id);
      if (shop) await sqliteRepo.upsertShop(shop);
      await sqliteRepo.upsertUser(user);
    } catch (e) {
      console.error('[dual][auth] sqlite write failed:', e.message);
    }
    return user;
  },
  async loginWithEmail(email, password) {
    return mongoRepo.loginWithEmail(email, password);
  },
  async updateUserPassword(userId, newHash) {
    const ok = await mongoRepo.updateUserPassword(userId, newHash);
    try { await sqliteRepo.updateUserPassword(userId, newHash); } catch (e) { console.error('[dual][auth] sqlite write failed:', e.message); }
    return ok;
  },
  async updateShop(shopId, name, address) {
    const ok = await mongoRepo.updateShop(shopId, name, address);
    try { await sqliteRepo.updateShop(shopId, name, address); } catch (e) { console.error('[dual][auth] sqlite write failed:', e.message); }
    return ok;
  },
};

function getAuthRepo() {
  const provider = getDbProvider();
  if (provider === 'mongo') return mongoRepo;
  if (provider === 'dual') return dualRepo;
  return sqliteRepo;
}

module.exports = {
  getAuthRepo,
};

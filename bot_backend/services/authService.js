const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { getAuthRepo } = require('../repositories/auth.repo');

// Never accept a predictable signing key. Developer sessions use a non-persistent random key.
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to a strong 32+ character secret');
}
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, shop_id: user.shop_id, role: user.role, auth_version: Number(user.auth_version || 0) },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

async function getOrCreateUserFromTelegram(telegramUser, shopName) {
  return getAuthRepo().getOrCreateUserFromTelegram(telegramUser, shopName);
}

async function registerWithEmail(email, password, shopName) {
  return getAuthRepo().registerWithEmail(email, password, shopName);
}

async function loginWithEmail(email, password) {
  return getAuthRepo().loginWithEmail(email, password);
}

module.exports = {
  generateToken,
  verifyToken,
  getOrCreateUserFromTelegram,
  registerWithEmail,
  loginWithEmail,
};

const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { getAuthRepo } = require('../repositories/auth.repo');

// Never accept a predictable signing key. Developer sessions use a non-persistent random key.
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to a strong 32+ character secret');
}
const fs = require('node:fs');
const path = require('node:path');

function resolveJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to a strong 32+ character secret');
  }
  const secretPath = path.resolve(__dirname, '../.jwt_secret');
  try {
    if (fs.existsSync(secretPath)) {
      const stored = fs.readFileSync(secretPath, 'utf8').trim();
      if (stored.length >= 32) return stored;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, generated, 'utf8');
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const JWT_SECRET = resolveJwtSecret();

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

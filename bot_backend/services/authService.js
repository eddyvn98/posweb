const jwt = require('jsonwebtoken');
const { getAuthRepo } = require('../repositories/auth.repo');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, shop_id: user.shop_id, role: user.role },
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

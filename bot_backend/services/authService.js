const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { getAuthRepo } = require('../repositories/auth.repo');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

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

async function registerWithEmail(email, password, shopName, inviteCode) {
  return getAuthRepo().registerWithEmail(email, password, shopName, inviteCode);
}

async function loginWithEmail(email, password) {
  return getAuthRepo().loginWithEmail(email, password);
}

function getGoogleClientId() {
  return GOOGLE_CLIENT_ID;
}

async function verifyGoogleCredential(credential) {
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    throw new Error('Google login chua duoc cau hinh');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) {
    throw new Error('Tai khoan Google khong hop le');
  }

  return {
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || null,
    sub: payload.sub,
  };
}

function buildDefaultShopName(profile) {
  const label = (profile.name || profile.email || 'Google User').trim();
  return `Cua hang cua ${label}`.slice(0, 120);
}

async function loginWithGoogleCredential(credential) {
  const profile = await verifyGoogleCredential(credential);
  const repo = getAuthRepo();
  const user = await repo.getOrCreateUserFromGoogle(profile, buildDefaultShopName(profile));
  return { user, profile };
}

module.exports = {
  generateToken,
  verifyToken,
  getOrCreateUserFromTelegram,
  registerWithEmail,
  loginWithEmail,
  getGoogleClientId,
  loginWithGoogleCredential,
};

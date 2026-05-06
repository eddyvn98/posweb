const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
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

async function requestPasswordReset(email) {
  const repo = getAuthRepo();
  const user = await repo.getUserByEmail(email);

  if (!user) {
    throw new Error('Email khong ton tai trong he thong');
  }

  // 1. Generate Token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour

  // 2. Save Token
  await repo.setUserResetToken(email, token, expires);

  // 3. Send Email
  const resetLink = `${process.env.WEB_APP_URL}/reset-password?token=${token}`;
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"POSweb Support" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Khoi phuc mat khau POSweb',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #db2777;">Yeu cau khoi phuc mat khau</h2>
        <p>Chao ban,</p>
        <p>Chung toi nhan duoc yeu cau khoi phuc mat khau cho tai khoan POSweb cua ban. Vui long nhan vao nut duoi day de tao mat khau moi:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #db2777; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Dat lai mat khau</a>
        </div>
        <p>Lien ket nay se het han trong 1 gio.</p>
        <p>Neu ban khong thuc hien yeu cau nay, vui long bo qua email nay.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Day la email tu dong, vui long khong tra loi.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Error sending reset email:', err.message);
    // Notify admin via Telegram if email fails
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;
    if (BOT_TOKEN && ADMIN_ID) {
      const message = `⚠️ *LOI GUI EMAIL RESET MAT KHAU*\n\n` +
        `📧 *Email:* ${email}\n` +
        `❌ *Loi:* ${err.message}\n` +
        `🔗 *Link reset:* ${resetLink}`;
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { chat_id: ADMIN_ID, text: message, parse_mode: 'Markdown' });
    }
    throw new Error('Khong the gui email luc nay. Vui long lien he support qua Zalo/Telegram.');
  }

  return { success: true, message: 'Email khoi phuc da duoc gui' };
}

async function resetPasswordWithToken(token, newPassword) {
  const repo = getAuthRepo();
  const user = await repo.getUserByResetToken(token);

  if (!user) {
    throw new Error('Lien ket khong hop le hoac da het han');
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  await repo.updateUserPassword(user.id, passwordHash);

  return { success: true };
}

module.exports = {
  generateToken,
  verifyToken,
  getOrCreateUserFromTelegram,
  registerWithEmail,
  loginWithEmail,
  getGoogleClientId,
  loginWithGoogleCredential,
  requestPasswordReset,
  resetPasswordWithToken,
};

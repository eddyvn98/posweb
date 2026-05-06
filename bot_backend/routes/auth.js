const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const authService = require('../services/authService');
const { getAuthRepo } = require('../repositories/auth.repo');
const { authenticateToken } = require('../middleware/auth');
const updateShop = require('../controllers/auth/updateShop');
const changePassword = require('../controllers/auth/changePassword');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Lax for cross-site navigation, strict can break oauth redirects sometimes, though this is an API.
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};
router.post('/telegram-auth', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'Missing initData' });

    const urlParams = new URLSearchParams(initData);
    let hash = '';
    const dataCheckArr = [];
    urlParams.sort();

    for (const [key, value] of urlParams.entries()) {
      if (key === 'hash') {
        hash = value;
        continue;
      }
      dataCheckArr.push(`${key}=${value}`);
    }

    const dataCheckString = dataCheckArr.join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN || '').digest();
    const generatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (generatedHash !== hash) {
      return res.status(403).json({ error: 'Invalid hash' });
    }

    const userStr = urlParams.get('user');
    if (!userStr) return res.status(400).json({ error: 'User data not found' });

    const telegramUser = JSON.parse(userStr);
    const shopName = `Cua hang cua ${telegramUser.first_name || telegramUser.id}`;

    const user = await authService.getOrCreateUserFromTelegram(telegramUser, shopName);
    const token = authService.generateToken(user);
    const shop = await getAuthRepo().getShopById(user.shop_id);

    setTokenCookie(res, token);
    res.json({ success: true, token, user, shop });
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/google-config', (req, res) => {
  const clientId = authService.getGoogleClientId();
  res.json({
    configured: Boolean(clientId),
    client_id: clientId || null,
  });
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    const { user } = await authService.loginWithGoogleCredential(credential);
    const token = authService.generateToken(user);
    const shop = await getAuthRepo().getShopById(user.shop_id);

    setTokenCookie(res, token);
    res.json({ success: true, token, user, shop });
  } catch (error) {
    res.status(401).json({ error: error.message || 'Google login failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Thieu email hoac mat khau' });
    }

    const user = await authService.loginWithEmail(email, password);
    const token = authService.generateToken(user);
    const shop = await getAuthRepo().getShopById(user.shop_id);

    setTokenCookie(res, token);
    res.json({ success: true, token, user, shop });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, shopName, inviteCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Thieu thong tin dang ky' });
    }
    // shopName required only when NOT joining via invite code
    if (!inviteCode && !shopName) {
      return res.status(400).json({ error: 'Thieu ten cua hang' });
    }

    const user = await authService.registerWithEmail(email, password, shopName || '', inviteCode);
    const token = authService.generateToken(user);
    const shop = await getAuthRepo().getShopById(user.shop_id);

    setTokenCookie(res, token);
    res.json({ success: true, token, user, shop });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/shop', authenticateToken, updateShop);
router.patch('/change-password', authenticateToken, changePassword);
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Vui long nhap email' });
    const result = await authService.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Thieu thong tin' });
    const result = await authService.resetPasswordWithToken(token, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

module.exports = router;

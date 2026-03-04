const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const authService = require('../services/authService');
const db = require('../db/connection');
const authenticateToken = require('../middleware/auth');
const updateShop = require('../controllers/auth/updateShop');
const changePassword = require('../controllers/auth/changePassword');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

router.post('/telegram-auth', (req, res) => {
    try {
        const { initData } = req.body;
        if (!initData) return res.status(400).json({ error: 'Missing initData' });

        const urlParams = new URLSearchParams(initData);
        let hash = '';
        const dataCheckArr = [];
        urlParams.sort();

        for (const [key, value] of urlParams.entries()) {
            if (key === 'hash') { hash = value; continue; }
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
        const shopName = `Cửa hàng của ${telegramUser.first_name || telegramUser.id}`;

        const user = authService.getOrCreateUserFromTelegram(telegramUser, shopName);
        const token = authService.generateToken(user);
        const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(user.shop_id);

        // ...existing code...
        res.json({
            success: true,
            token,
            user,
            shop
        });
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
        }

        const user = authService.loginWithEmail(email, password);
        const token = authService.generateToken(user);
        const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(user.shop_id);

        res.json({
            success: true,
            token,
            user,
            shop
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

router.post('/register', (req, res) => {
    try {
        const { email, password, shopName } = req.body;
        if (!email || !password || !shopName) {
            return res.status(400).json({ error: 'Thiếu thông tin đăng ký' });
        }

        const user = authService.registerWithEmail(email, password, shopName);
        const token = authService.generateToken(user);
        const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(user.shop_id);

        res.json({
            success: true,
            token,
            user,
            shop
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.patch('/shop', authenticateToken, updateShop);
router.patch('/change-password', authenticateToken, changePassword);

module.exports = router;



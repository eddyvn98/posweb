const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { v4: uuidv4 } = require('uuid');

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

function getOrCreateUserFromTelegram(telegramUser, shopName) {
    const telegramId = telegramUser.id.toString();

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);

    if (!user) {
        // Create new shop for the user (Supabase logic)
        const shopId = uuidv4();
        db.prepare('INSERT INTO shops (id, name) VALUES (?, ?)').run(shopId, shopName);

        // Create user
        const userId = uuidv4();
        const email = `${telegramId}@telegram.posweb.com`;
        db.prepare(`
            INSERT INTO users (id, shop_id, email, role, telegram_id) 
            VALUES (?, ?, ?, 'owner', ?)
        `).run(userId, shopId, email, telegramId);

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    return user;
}

module.exports = {
    generateToken,
    verifyToken,
    getOrCreateUserFromTelegram
};

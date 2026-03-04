const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

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
        // Create new shop for the user
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

function registerWithEmail(email, password, shopName) {
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
        throw new Error('Email đã tồn tại trong hệ thống');
    }

    const shopId = uuidv4();
    db.prepare('INSERT INTO shops (id, name) VALUES (?, ?)').run(shopId, shopName);

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(`
        INSERT INTO users (id, shop_id, email, password, role) 
        VALUES (?, ?, ?, ?, 'owner')
    `).run(userId, shopId, email, passwordHash);

    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

function loginWithEmail(email, password) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !user.password) {
        throw new Error('Email hoặc mật khẩu không chính xác');
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
        throw new Error('Email hoặc mật khẩu không chính xác');
    }

    return user;
}

module.exports = {
    generateToken,
    verifyToken,
    getOrCreateUserFromTelegram,
    registerWithEmail,
    loginWithEmail
};


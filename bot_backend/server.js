const express = require('express');
const cors = require('cors');
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const { initSchema } = require('./db/schema');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const reportsRoutes = require('./routes/reports');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Database
initSchema();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);

// Telegram Bot Setup
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let WEB_APP_URL = process.env.WEB_APP_URL || 'https://google.com';

if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    bot.start((ctx) => {
        ctx.reply(
            'Chào mừng bạn đến với POS Web! Nhấn vào nút bên dưới để mở ứng dụng quản lý bán hàng.',
            Markup.inlineKeyboard([
                Markup.button.webApp("Mở POS Shop", WEB_APP_URL)
            ])
        );
    });

    bot.launch()
        .then(() => console.log('🤖 Telegram Bot is running...'))
        .catch(err => console.error('Bot launch error:', err));

    // Get current WebApp URL (for debugging)
    app.get('/api/admin/config/webapp-url', (req, res) => {
        res.json({ url: WEB_APP_URL });
    });

    // Admin endpoint to update URL on the fly
    app.post('/api/admin/config/webapp-url', (req, res) => {
        const { url } = req.body;
        if (url) {
            WEB_APP_URL = url;
            console.log(`✨ Bot WebApp URL updated to: ${WEB_APP_URL}`);
            return res.json({ success: true, url: WEB_APP_URL });
        }
        res.status(400).json({ error: 'Missing url in body' });
    });

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN missing. Bot will not run.');
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
    console.log(`🌐 API Server listening at http://localhost:${port}`);
});

const express = require('express');
const cors = require('cors');
const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const { initSchema } = require('./db/schema');
const { getDbProvider, isMongoEnabled, isSqliteEnabled } = require('./db/provider');
const { connectMongo, getMongoHealth } = require('./db/mongo');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const reportsRoutes = require('./routes/reports');
const importsRoutes = require('./routes/imports');
const unitsRoutes = require('./routes/units');
const categoriesRoutes = require('./routes/categories');
const suppliersRoutes = require('./routes/suppliers');
const filesRoutes = require('./routes/files');
const storefrontRoutes = require('./routes/storefront');
const adminOrdersRoutes = require('./routes/adminOrders');

const app = express();
const port = process.env.PORT || 3001;
const dbProvider = getDbProvider();

if (isSqliteEnabled()) {
    initSchema({ seedDefaults: dbProvider === 'sqlite' });
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '12mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/admin/online-orders', adminOrdersRoutes);

// Telegram Bot Setup
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let WEB_APP_URL = process.env.WEB_APP_URL || 'https://google.com';

if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    bot.start((ctx) => {
        ctx.reply(
            'Chào mừng bạn đến với POS Web! Nhấn vào nút bên dưới để mở ứng dụng quản lý bán hàng.',
            Markup.inlineKeyboard([
                Markup.button.webApp("Mở PosWebFree", WEB_APP_URL)
            ])
        );
    });

    bot.launch()
        .then(() => console.log('🤖 Telegram Bot is running...'))
        .catch(err => console.error('Bot launch error:', err));

    app.get('/api/admin/config/webapp-url', (req, res) => {
        res.json({ url: WEB_APP_URL });
    });

    // Image Proxy for Telegram file_id
    app.get('/api/images/tg/:fileId', async (req, res) => {
        const { fileId } = req.params;
        try {
            const file = await bot.telegram.getFile(fileId);
            const fileLink = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
            res.redirect(fileLink);
        } catch (error) {
            console.error('File Proxy Error:', error);
            res.status(404).send('Image not found');
        }
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

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        provider: dbProvider,
        sqlite: {
            enabled: isSqliteEnabled(),
            connected: isSqliteEnabled()
        },
        mongo: {
            enabled: isMongoEnabled(),
            ...getMongoHealth()
        }
    });
});

async function startServer() {
    if (isMongoEnabled()) {
        await connectMongo();
        console.log('MongoDB connected');
    }

    app.listen(port, () => {
        console.log(`🌐 API Server listening at http://localhost:${port}`);

        // Khởi động lịch trình sao lưu tự động định kỳ mỗi ngày (giữ tối đa 30 bản)
        const { startDailyBackupScheduler } = require('./services/backupService');
        startDailyBackupScheduler({ maxBackups: 30 });
    });
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

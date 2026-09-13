const express = require('express');
const cors = require('cors');
const { Telegraf, Markup } = require('telegraf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const cron = require('node-cron');
const { initSchema } = require('./db/schema');
const { getDbProvider, isMongoEnabled, isSqliteEnabled } = require('./db/provider');
const { connectMongo, getMongoHealth } = require('./db/mongo');
const { testPostgresConnection } = require('./db/postgres');
const { syncSqliteToPostgres } = require('./services/postgresSyncService');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const reportsRoutes = require('./routes/reports');
const importsRoutes = require('./routes/imports');
const unitsRoutes = require('./routes/units');
const categoriesRoutes = require('./routes/categories');
const suppliersRoutes = require('./routes/suppliers');
const filesRoutes = require('./routes/files');
const staffRoutes = require('./routes/staff');
const storefrontRoutes = require('./routes/storefront');
const webOrdersRoutes = require('./routes/webOrders');

const app = express();
app.set('trust proxy', 1); // Trust first proxy for Secure cookies
const port = process.env.PORT || 3001;
const dbProvider = getDbProvider();

if (isSqliteEnabled()) {
    initSchema({ seedDefaults: dbProvider === 'sqlite' });
}

// Middlewares
const allowedOrigins = ['http://localhost:5173', 'http://localhost:4011', 'http://127.0.0.1:4011', 'https://poswebfree.vivutrade.io.vn', 'https://t.me'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || /^https:\/\/[a-zA-Z0-9-]+\.vivutrade\.io\.vn$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:", "blob:", "https://*.telegram.org", "https://api.telegram.org", "https://*.googleusercontent.com", "https://images.unsplash.com", "https://*.unsplash.com"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://telegram.org", "https://accounts.google.com", "https://static.cloudflareinsights.com"],
            "connect-src": ["'self'", "https://api.telegram.org", "https://poswebfree.vivutrade.io.vn"],
            "frame-src": ["'self'", "https://*.google.com"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"]
        },
    },
}));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/static', express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many authentication attempts, please try again later.' }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/web-orders', webOrdersRoutes);

// Public image fetch proxy used by guest/demo seeding to bypass browser CORS.
app.get('/api/images/fetch', async (req, res) => {
    try {
        const rawUrl = String(req.query.url || '').trim();
        if (!rawUrl) return res.status(400).json({ error: 'Missing url' });
        let parsed;
        try {
            parsed = new URL(rawUrl);
        } catch {
            return res.status(400).json({ error: 'Invalid url' });
        }
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return res.status(400).json({ error: 'Unsupported protocol' });
        }
        const upstream = await fetch(parsed.toString());
        if (!upstream.ok) return res.status(502).json({ error: `Upstream status ${upstream.status}` });
        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        const arr = await upstream.arrayBuffer();
        const base64 = Buffer.from(arr).toString('base64');
        res.json({ dataUrl: `data:${contentType};base64,${base64}` });
    } catch (error) {
        console.error('Image fetch proxy error:', error.message);
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});

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

    // bot.launch()
        // .then(() => console.log('🤖 Telegram Bot is running...'))
        // .catch(err => console.error('Bot launch error:', err));

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
    // process.once('SIGINT', () => bot.stop('SIGINT'));
    // process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN missing. Bot will not run.');
}

app.get('/health', async (req, res) => {
    const postgres = await testPostgresConnection();
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
        },
        postgres
    });
});

async function startServer() {
    if (isMongoEnabled()) {
        await connectMongo();
        console.log('MongoDB connected');
    }

    app.listen(port, () => {
        console.log(`🌐 API Server listening at http://localhost:${port}`);

        // Schedule backup at 2 AM every day
        cron.schedule('0 2 * * *', async () => {
            console.log('⏰ Starting scheduled backup at 2 AM...');
            try {
                const { sendBackupToTelegram } = require('./services/backupService');
                await sendBackupToTelegram();
            } catch (e) {
                console.error('Scheduled backup failed:', e.message);
            }
        });

        cron.schedule('* * * * *', async () => {
            try {
                const result = await syncSqliteToPostgres();
                if (!result.skipped) {
                    const total = result.summary.reduce((sum, item) => sum + item.rows, 0);
                    console.log(`[postgres-sync] synced ${total} rows`);
                }
            } catch (e) {
                console.error('[postgres-sync] sync failed:', e.message);
            }
        });

        // Tự động backup khi khởi động (chạy sau 5s để đảm bảo DB đã sẵn sàng)
        setTimeout(async () => {
            try {
                const { sendBackupToTelegram } = require('./services/backupService');
                await sendBackupToTelegram();
            } catch (e) {
                console.error('Auto backup failed:', e.message);
            }
        }, 5000);

        setTimeout(async () => {
            try {
                const result = await syncSqliteToPostgres();
                if (!result.skipped) {
                    const total = result.summary.reduce((sum, item) => sum + item.rows, 0);
                    console.log(`[postgres-sync] initial sync done, rows=${total}`);
                } else {
                    console.log(`[postgres-sync] skipped: ${result.reason}`);
                }
            } catch (e) {
                console.error('[postgres-sync] initial sync failed:', e.message);
            }
        }, 7000);
    });
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

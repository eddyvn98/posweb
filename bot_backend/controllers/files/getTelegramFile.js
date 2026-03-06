const axios = require('axios');
const { Telegraf } = require('telegraf');

async function getTelegramFile(req, res) {
    const fileId = decodeURIComponent(req.query.fileId || req.params.fileId || '');
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!BOT_TOKEN) {
        return res.status(500).json({ error: 'Telegram configuration missing' });
    }

    try {
        const bot = new Telegraf(BOT_TOKEN);
        const file = await bot.telegram.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
        const response = await axios.get(fileUrl, { responseType: 'stream' });
        const filename = file.file_path.split('/').pop() || fileId;
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const dispositionType = req.query.download === '1' ? 'attachment' : 'inline';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `${dispositionType}; filename="${filename}"`);
        response.data.pipe(res);
    } catch (error) {
        console.error('Telegram File Proxy Error:', error.message);
        res.status(404).json({ error: 'File not found' });
    }
}

module.exports = getTelegramFile;

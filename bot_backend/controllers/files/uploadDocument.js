const axios = require('axios');
const FormData = require('form-data');
const { getAuthRepo } = require('../../repositories/auth.repo');

function parseDataUrl(input) {
    const match = String(input || '').match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return {
        mimeType: match[1],
        base64: match[2]
    };
}

async function resolveChatId() {
    let chatId = process.env.ADMIN_TELEGRAM_ID;
    if (!chatId) {
        chatId = await getAuthRepo().getOwnerTelegramId();
    }
    return chatId;
}

async function uploadDocument(req, res) {
    const { file_name, data_url } = req.body;
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = await resolveChatId();

    if (!BOT_TOKEN || !chatId) {
        return res.status(500).json({ error: 'Telegram configuration missing' });
    }

    const parsed = parseDataUrl(data_url);
    if (!parsed) {
        return res.status(400).json({ error: 'Invalid file payload' });
    }

    try {
        const buffer = Buffer.from(parsed.base64, 'base64');
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('document', buffer, {
            filename: file_name || 'attachment',
            contentType: parsed.mimeType || 'application/octet-stream'
        });

        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, formData, {
            headers: formData.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        if (!response.data.ok) {
            throw new Error(response.data.description || 'Telegram upload failed');
        }

        const document = response.data.result.document;
        return res.json({
            success: true,
            file_id: document.file_id,
            mime_type: document.mime_type || parsed.mimeType,
            file_name: document.file_name || file_name
        });
    } catch (error) {
        console.error('Telegram Document Upload Error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
}

module.exports = uploadDocument;

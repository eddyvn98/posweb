const axios = require('axios');
const FormData = require('form-data');
const { getAuthRepo } = require('../../repositories/auth.repo');

async function uploadImage(req, res) {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ error: 'No image data provided' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    let chatId = process.env.ADMIN_TELEGRAM_ID;
    if (!chatId) {
        try {
            const { shop_id } = req.user || {};
            chatId = await getAuthRepo().getOwnerTelegramId(shop_id);
        } catch (e) {
            console.error('Error fetching owner telegram id:', e);
        }
    }

    // If Telegram is not configured, return success: false gracefully
    // This allows the frontend to fallback to base64 without a console error
    if (!BOT_TOKEN || !chatId) {
        return res.json({ 
            success: false, 
            error: 'Telegram configuration missing',
            details: 'Please set TELEGRAM_BOT_TOKEN and ADMIN_TELEGRAM_ID in .env'
        });
    }

    try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', buffer, { filename: 'product.jpg' });

        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, formData, {
            headers: formData.getHeaders(),
            timeout: 10000 // Add timeout to avoid hanging
        });

        if (response.data.ok) {
            const photos = response.data.result.photo;
            const fileId = photos[photos.length - 1].file_id;
            return res.json({ success: true, file_id: fileId });
        }

        return res.json({ success: false, error: response.data.description || 'Telegram upload failed' });
    } catch (error) {
        console.error('Telegram Upload Error:', error.message);
        // Even on error, we return 200 with success: false to let frontend handle it gracefully
        res.json({ 
            success: false, 
            error: error.message || 'Failed to upload to Telegram' 
        });
    }
}

module.exports = uploadImage;

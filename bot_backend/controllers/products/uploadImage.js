const axios = require('axios');
const FormData = require('form-data');
const { getAuthRepo } = require('../../repositories/auth.repo');

async function uploadImage(req, res) {
    const { image } = req.body;
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    let chatId = process.env.ADMIN_TELEGRAM_ID;
    if (!chatId) {
        chatId = await getAuthRepo().getOwnerTelegramId();
    }

    if (!BOT_TOKEN || !chatId) {
        return res.status(500).json({ error: 'Telegram configuration missing' });
    }

    try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', buffer, { filename: 'product.jpg' });

        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, formData, {
            headers: formData.getHeaders()
        });

        if (response.data.ok) {
            const photos = response.data.result.photo;
            const fileId = photos[photos.length - 1].file_id;
            return res.json({ success: true, file_id: fileId });
        }

        throw new Error(response.data.description || 'Telegram upload failed');
    } catch (error) {
        console.error('Telegram Upload Error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload to Telegram' });
    }
}

module.exports = uploadImage;

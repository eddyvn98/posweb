const axios = require('axios');
const FormData = require('form-data');
const db = require('../../db/connection');

async function uploadImage(req, res) {
    const { image } = req.body; // Expecting base64 string
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    // Get chat ID (owner's chat)
    let chatId = process.env.ADMIN_TELEGRAM_ID;
    if (!chatId) {
        const owner = db.prepare("SELECT telegram_id FROM users WHERE role = 'owner' LIMIT 1").get();
        chatId = owner ? owner.telegram_id : null;
    }

    if (!BOT_TOKEN || !chatId) {
        return res.status(500).json({ error: 'Telegram configuration missing' });
    }

    try {
        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', buffer, { filename: 'product.jpg' });

        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, formData, {
            headers: formData.getHeaders()
        });

        if (response.data.ok) {
            // Telegram returns an array of photos, the last one is the largest
            const photos = response.data.result.photo;
            const fileId = photos[photos.length - 1].file_id;
            return res.json({ success: true, file_id: fileId });
        } else {
            throw new Error(response.data.description);
        }
    } catch (error) {
        console.error('Telegram Upload Error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload to Telegram' });
    }
}

module.exports = uploadImage;

const fs = require('fs');
const path = require('path');
const db = require('../db/connection');
const axios = require('axios');
const FormData = require('form-data');

/**
 * Service xử lý việc sao lưu Database và gửi qua Telegram
 */
async function sendBackupToTelegram() {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    // Chúng ta sẽ lấy Telegram ID của chủ shop từ DB hoặc .env
    // Ưu tiên lấy từ .env nếu có cấu hình riêng cho backup, nếu không lấy của owner đầu tiên trong DB
    let chatId = process.env.ADMIN_TELEGRAM_ID;

    if (!chatId) {
        const owner = db.prepare("SELECT telegram_id FROM users WHERE role = 'owner' LIMIT 1").get();
        chatId = owner ? owner.telegram_id : null;
    }

    const dbPath = path.resolve(__dirname, '../pos.db');

    if (!BOT_TOKEN || !chatId) {
        console.error('⚠️ Thiếu cấu hình Telegram (Token hoặc Chat ID) để backup.');
        return { success: false, error: 'Missing Telegram config' };
    }

    try {
        const fileName = `pos_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
        console.log(`📦 Đang gửi bản sao lưu qua Telegram: ${fileName}...`);

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('document', fs.createReadStream(dbPath), { filename: fileName });
        formData.append('caption', `📦 Bản sao lưu hệ thống POS\n📅 Ngày: ${new Date().toLocaleString('vi-VN')}\n💾 Kích thước: ${(fs.statSync(dbPath).size / 1024 / 1024).toFixed(2)} MB`);

        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data.ok) {
            console.log('✅ Sao lưu qua Telegram thành công!');

            const shop = db.prepare("SELECT id FROM shops LIMIT 1").get();
            const shopId = shop ? shop.id : 'default-shop';

            // Lưu log vào DB
            db.prepare(`
                INSERT INTO backup_logs (id, shop_id, status, file_name, file_size_bytes)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                require('uuid').v4(),
                shopId,
                'SUCCESS',
                fileName,
                fs.statSync(dbPath).size
            );

            return { success: true };
        } else {
            throw new Error(response.data.description);
        }
    } catch (error) {
        console.error('❌ Lỗi sao lưu Telegram:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { sendBackupToTelegram };

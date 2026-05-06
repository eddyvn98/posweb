const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');
const AdmZip = require('adm-zip');
const { getTenantConnection } = require('../db/tenantManager');

/**
 * Service xử lý việc sao lưu toàn bộ MongoDB (Central + Tenants) và gửi qua Telegram
 */
async function sendBackupToTelegram() {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_TELEGRAM_ID;

    if (!BOT_TOKEN || !chatId) {
        console.error('⚠️ Thiếu cấu hình Telegram (Token hoặc Chat ID) để backup.');
        return { success: false, error: 'Missing Telegram config' };
    }

    const backupDir = path.resolve(__dirname, '../../backups');
    const tempDir = path.join(backupDir, `temp_${Date.now()}`);
    
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    try {
        console.log('📦 Bắt đầu quy trình sao lưu MongoDB...');
        
        // 1. Sao lưu Central DB (Users, Shops, v.v.)
        const centralDir = path.join(tempDir, 'central');
        if (!fs.existsSync(centralDir)) fs.mkdirSync(centralDir);

        const centralCollections = await mongoose.connection.db.listCollections().toArray();
        for (const col of centralCollections) {
            const data = await mongoose.connection.db.collection(col.name).find({}).toArray();
            fs.writeFileSync(path.join(centralDir, `${col.name}.json`), JSON.stringify(data, null, 2));
        }

        // 2. Lấy danh sách shop để sao lưu từng Tenant DB
        const Shop = mongoose.model('Shop');
        const shops = await Shop.find({}).lean();
        
        const shopsBaseDir = path.join(tempDir, 'shops');
        if (!fs.existsSync(shopsBaseDir)) fs.mkdirSync(shopsBaseDir);

        for (const shop of shops) {
            // Tạo tên thư mục an toàn: TenShop_ID
            const safeName = (shop.name || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const shopFolder = `${safeName}_${shop.id}`;
            const shopDir = path.join(shopsBaseDir, shopFolder);
            if (!fs.existsSync(shopDir)) fs.mkdirSync(shopDir);

            console.log(`  - Đang sao lưu shop: ${shop.name} (${shop.id}) -> ${shopFolder}`);
            
            const conn = getTenantConnection(shop.id);
            // Chờ kết nối sẵn sàng nếu chưa
            if (conn.readyState !== 1) {
                await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        console.warn(`    ⚠️ Timeout chờ kết nối tới DB shop ${shop.id}`);
                        resolve();
                    }, 5000);
                    conn.once('connected', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                });
            }
            
            if (conn.readyState === 1) {
                const collections = await conn.db.listCollections().toArray();
                for (const col of collections) {
                    const data = await conn.db.collection(col.name).find({}).toArray();
                    fs.writeFileSync(path.join(shopDir, `${col.name}.json`), JSON.stringify(data, null, 2));
                }
            } else {
                console.error(`    ❌ Không thể kết nối tới database của shop ${shop.id}, bỏ qua.`);
            }
        }

        // 3. Nén folder backup
        const zip = new AdmZip();
        zip.addLocalFolder(tempDir);
        const zipFileName = `pos_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
        const zipPath = path.join(backupDir, zipFileName);
        zip.writeZip(zipPath);

        // 4. Gửi qua Telegram
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('document', fs.createReadStream(zipPath), { filename: zipFileName });
        formData.append('caption', `📦 Bản sao lưu MongoDB (Multi-Tenant)\n📅 Ngày: ${new Date().toLocaleString('vi-VN')}\n💾 Kích thước: ${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)} MB`);

        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // 5. Dọn dẹp
        fs.rmSync(tempDir, { recursive: true, force: true });
        // Xóa file zip sau khi gửi (hoặc giữ lại tùy ý)
        // fs.unlinkSync(zipPath);

        if (response.data.ok) {
            console.log('✅ Sao lưu MongoDB qua Telegram thành công!');
            return { success: true };
        } else {
            throw new Error(response.data.description);
        }
    } catch (error) {
        console.error('❌ Lỗi sao lưu MongoDB:', error.message);
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        return { success: false, error: error.message };
    }
}

module.exports = { sendBackupToTelegram };

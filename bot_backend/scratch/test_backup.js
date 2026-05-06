const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { connectMongo } = require('../db/mongo');
const { sendBackupToTelegram } = require('../services/backupService');

// Đăng ký models
require('../mongo/models/Shop');
require('../mongo/models/User');

async function testBackup() {
    console.log('🚀 Bắt đầu test sao lưu...');
    
    try {
        await connectMongo();
        console.log('✅ Đã kết nối MongoDB');

        // Mock Telegram Config nếu thiếu để không bị chặn bởi check ở service
        if (!process.env.TELEGRAM_BOT_TOKEN) process.env.TELEGRAM_BOT_TOKEN = 'mock_token';
        if (!process.env.ADMIN_TELEGRAM_ID) process.env.ADMIN_TELEGRAM_ID = 'mock_id';

        // Ghi đè hàm gửi Telegram để chỉ test logic tạo file
        const axios = require('axios');
        const originalPost = axios.post;
        axios.post = async () => {
            console.log('ℹ️ Mocking Telegram sendDocument (bỏ qua việc gửi thật)');
            return { data: { ok: true } };
        };

        const result = await sendBackupToTelegram();
        console.log('📊 Kết quả backup:', result);

        // Kiểm tra file ZIP
        const backupDir = path.resolve(__dirname, '../../backups');
        if (fs.existsSync(backupDir)) {
            const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.zip')).sort();
            const latestZip = files[files.length - 1];
            
            if (latestZip) {
                const zipPath = path.join(backupDir, latestZip);
                const stats = fs.statSync(zipPath);
                console.log(`\n📦 File backup mới nhất: ${latestZip}`);
                console.log(`   Dung lượng tổng: ${(stats.size / 1024).toFixed(2)} KB`);

                const AdmZip = require('adm-zip');
                const zip = new AdmZip(zipPath);
                const zipEntries = zip.getEntries();
                
                console.log('   Nội dung bên trong:');
                zipEntries.forEach(entry => {
                    if (!entry.isDirectory) {
                        console.log(`     - ${entry.entryName}: ${entry.header.size} bytes`);
                        if (entry.header.size <= 2) {
                            console.warn(`       ⚠️ Cảnh báo: File ${entry.entryName} gần như rỗng!`);
                        }
                    }
                });
            }
        } else {
            console.error('❌ Thư mục backup không tồn tại!');
        }

        axios.post = originalPost; // Restore
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi test backup:', error);
        process.exit(1);
    }
}

testBackup();

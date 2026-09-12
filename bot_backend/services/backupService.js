const fs = require('fs');
const path = require('path');
const db = require('../db/connection');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

const BACKUP_DIR = path.resolve(__dirname, '../backups');
const MAX_BACKUPS = 30;

/**
 * Dọn dẹp các bản sao lưu cũ, chỉ giữ tối đa maxFiles bản mới nhất
 */
function cleanupOldBackups(backupDir = BACKUP_DIR, maxFiles = MAX_BACKUPS) {
    try {
        if (!fs.existsSync(backupDir)) return [];

        const files = fs.readdirSync(backupDir)
            .filter(file => file.startsWith('pos_backup_') && file.endsWith('.db'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    file,
                    filePath,
                    mtime: stats.mtimeMs,
                    size: stats.size
                };
            })
            // Sắp xếp ưu tiên theo tên file (ISO timestamp) và thời gian sửa đổi (mới nhất lên đầu)
            .sort((a, b) => b.file.localeCompare(a.file) || (b.mtime - a.mtime));

        const deletedFiles = [];
        if (files.length > maxFiles) {
            const filesToRemove = files.slice(maxFiles);
            for (const item of filesToRemove) {
                try {
                    fs.unlinkSync(item.filePath);
                    deletedFiles.push(item.file);
                    console.log(`🗑️ Đã xóa bản sao lưu cũ: ${item.file}`);
                } catch (e) {
                    console.error(`⚠️ Không thể xóa file backup cũ ${item.file}:`, e.message);
                }
            }
        }
        return deletedFiles;
    } catch (err) {
        console.error('⚠️ Lỗi dọn dẹp backup cũ:', err.message);
        return [];
    }
}

/**
 * Tạo bản sao lưu SQLite vào ổ cứng và tự động dọn dẹp giữ tối đa maxBackups bản
 */
async function createLocalBackup(options = {}) {
    const backupDir = options.backupDir || BACKUP_DIR;
    const maxBackups = options.maxBackups || MAX_BACKUPS;

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `pos_backup_${timestamp}.db`;
    const targetPath = path.join(backupDir, fileName);

    try {
        console.log(`💾 Đang sao lưu Database vào ổ cứng: ${fileName}...`);
        await db.backup(targetPath);
        const fileSize = fs.statSync(targetPath).size;
        console.log(`✅ Sao lưu cục bộ thành công! (${(fileSize / 1024).toFixed(2)} KB)`);

        // Dọn dẹp bản sao lưu cũ vượt quá giới hạn
        const deleted = cleanupOldBackups(backupDir, maxBackups);

        // Ghi log vào DB nếu có bảng backup_logs
        try {
            const shop = db.prepare("SELECT id FROM shops LIMIT 1").get();
            const shopId = shop ? shop.id : 'default-shop';
            db.prepare(`
                INSERT INTO backup_logs (id, shop_id, status, file_name, file_size_bytes)
                VALUES (?, ?, ?, ?, ?)
            `).run(uuidv4(), shopId, 'LOCAL_SUCCESS', fileName, fileSize);
        } catch (dbErr) {
            // Log error silently
        }

        return {
            success: true,
            fileName,
            filePath: targetPath,
            fileSize,
            deletedCount: deleted.length
        };
    } catch (error) {
        console.error('❌ Lỗi sao lưu cục bộ:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Service xử lý việc sao lưu Database và gửi qua Telegram
 */
async function sendBackupToTelegram(backupFilePath = null, customFileName = null) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    let chatId = process.env.ADMIN_TELEGRAM_ID;

    if (!chatId) {
        try {
            const owner = db.prepare("SELECT telegram_id FROM users WHERE role = 'owner' LIMIT 1").get();
            chatId = owner ? owner.telegram_id : null;
        } catch (e) {}
    }

    const dbPath = backupFilePath || path.resolve(__dirname, '../pos.db');

    if (!BOT_TOKEN || !chatId) {
        console.warn('⚠️ Thiếu cấu hình Telegram (Token hoặc Chat ID) để backup.');
        return { success: false, error: 'Missing Telegram config' };
    }

    try {
        const fileName = customFileName || `pos_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
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

            try {
                const shop = db.prepare("SELECT id FROM shops LIMIT 1").get();
                const shopId = shop ? shop.id : 'default-shop';
                db.prepare(`
                    INSERT INTO backup_logs (id, shop_id, status, file_name, file_size_bytes)
                    VALUES (?, ?, ?, ?, ?)
                `).run(uuidv4(), shopId, 'TELEGRAM_SUCCESS', fileName, fs.statSync(dbPath).size);
            } catch (e) {}

            return { success: true };
        } else {
            throw new Error(response.data.description);
        }
    } catch (error) {
        console.error('❌ Lỗi sao lưu Telegram:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Lịch trình sao lưu hằng ngày (chạy sau khi khởi động 5s và lặp lại mỗi 24h)
 */
function startDailyBackupScheduler(options = {}) {
    const maxBackups = options.maxBackups || MAX_BACKUPS;
    const intervalMs = options.intervalMs || 24 * 60 * 60 * 1000; // 24 giờ

    const runBackupRoutine = async () => {
        console.log('⏰ Bắt đầu tiến trình sao lưu định kỳ...');
        const localResult = await createLocalBackup({ maxBackups });
        if (localResult.success) {
            await sendBackupToTelegram(localResult.filePath, localResult.fileName);
        }
    };

    // Chạy lần đầu sau 5 giây khi server khởi động
    const initialTimer = setTimeout(runBackupRoutine, 5000);

    // Lặp lại mỗi ngày (24 giờ)
    const intervalTimer = setInterval(runBackupRoutine, intervalMs);

    return {
        stop: () => {
            clearTimeout(initialTimer);
            clearInterval(intervalTimer);
        },
        triggerNow: runBackupRoutine
    };
}

module.exports = {
    createLocalBackup,
    sendBackupToTelegram,
    startDailyBackupScheduler,
    cleanupOldBackups
};

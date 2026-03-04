const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const db = require('../db/connection');

/**
 * Service xử lý việc sao lưu Database lên Google Drive
 */
async function uploadBackupToDrive() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const dbPath = path.resolve(__dirname, '../pos.db');

    if (!clientEmail || !privateKey) {
        console.error('⚠️ Thiếu cấu hình Google Service Account để backup.');
        return { success: false, error: 'Missing credentials' };
    }

    try {
        const auth = new google.auth.JWT(
            clientEmail,
            null,
            privateKey,
            ['https://www.googleapis.com/auth/drive.file']
        );

        const drive = google.drive({ version: 'v3', auth });

        const fileName = `pos_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;

        console.log(`📦 Đang tải lên bản sao lưu: ${fileName}...`);

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: 'application/x-sqlite3',
                // Có thể thêm parents: ['folder_id'] nếu muốn vào thư mục cụ thể
            },
            media: {
                mimeType: 'application/x-sqlite3',
                body: fs.createReadStream(dbPath),
            },
        });

        console.log('✅ Sao lưu thành công! File ID:', response.data.id);

        // Lưu log vào DB
        db.prepare(`
            INSERT INTO backup_logs (id, shop_id, status, file_name, file_size_bytes)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            require('uuid').v4(),
            'pos-shop-001', // Mặc định shop chính
            'SUCCESS',
            fileName,
            fs.statSync(dbPath).size
        );

        return { success: true, fileId: response.data.id };
    } catch (error) {
        console.error('❌ Lỗi sao lưu Google Drive:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { uploadBackupToDrive };

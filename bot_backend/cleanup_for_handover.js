const db = require('./db/connection');
const fs = require('fs');
const path = require('path');

async function cleanup() {
    console.log('🧹 Đang dọn dẹp hệ thống chuẩn bị bàn giao...');

    try {
        // 1. Xóa dữ liệu Test trong DB
        const transaction = db.transaction(() => {
            // Xóa các đơn hàng có mã "TEST-" hoặc "SALE-FULL-"
            db.prepare("DELETE FROM sales WHERE code LIKE 'TEST-%' OR code LIKE 'SALE-FULL-%'").run();
            // Xóa các sản phẩm test
            db.prepare("DELETE FROM products WHERE id LIKE 'PROD-%'").run();
            // Xóa các phiếu nhập test
            db.prepare("DELETE FROM imports WHERE id LIKE 'IMP-%'").run();
            // Xóa log tồn kho liên quan
            db.prepare("DELETE FROM inventory_logs WHERE note LIKE '%Test%' OR note LIKE '%DEBUG%'").run();
            // Xóa dòng tiền liên quan
            db.prepare("DELETE FROM cash_flows WHERE description LIKE '%Test%' OR description LIKE '%DEBUG%'").run();
        });

        transaction();
        console.log('✅ Đã xóa dữ liệu Test trong Database.');

        // 2. Xóa các file debug/test script
        const filesToDelete = [
            'test_sync.js',
            'diag_sync.js',
            'list_sheets.js',
            'read_rows.js',
            'diag.log',
            'diag_output.txt',
            'sheets_sync.log'
        ];

        filesToDelete.forEach(file => {
            const filePath = path.resolve(__dirname, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Đã xóa file: ${file}`);
            }
        });

        console.log('\n✨ Hệ thống đã sẵn sàng bàn giao!');
    } catch (err) {
        console.error('❌ Lỗi dọn dẹp:', err.message);
    }
}

cleanup();

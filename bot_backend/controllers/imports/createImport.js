const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');

function createImport(req, res) {
    const { shop_id } = req.user;
    const { import_date, supplier_name, total_cost, note } = req.body;

    if (!supplier_name || !total_cost) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction = db.transaction(() => {
        const importId = uuidv4();

        // 1. Create import record
        db.prepare(`
            INSERT INTO imports (id, shop_id, import_date, supplier_name, total_cost, note)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(importId, shop_id, import_date, supplier_name, total_cost, note || null);

        // 2. Create inventory log (placeholder for bulk import)
        const logId = uuidv4();
        db.prepare(`
            INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note)
            VALUES (?, ?, NULL, 0, 0, 'import', ?)
        `).run(logId, shop_id, `Nhập hàng từ ${supplier_name}`);

        // 3. Create cash flow (expense)
        const cashFlowId = uuidv4();
        db.prepare(`
            INSERT INTO cash_flows (id, shop_id, amount, type, category, description, ref_id, created_at)
            VALUES (?, ?, ?, 'out', 'import', ?, ?, ?)
        `).run(
            cashFlowId,
            shop_id,
            total_cost,
            `Nhập hàng từ ${supplier_name}`,
            importId,
            new Date(import_date).toISOString()
        );

        return importId;
    });

    try {
        const resultId = transaction();

        // Đồng bộ Google Sheet (chạy ngầm)
        const shop = db.prepare('SELECT name FROM shops WHERE id = ?').get(shop_id);
        const { syncImport, syncCashFlow } = require('../../services/googleSheetService');
        const shopName = shop ? shop.name : 'Cửa hàng';

        syncImport({ id: resultId, import_date, supplier_name, total_cost, note }, shopName);
        syncCashFlow({
            amount: total_cost,
            type: 'out',
            category: 'import',
            description: `Nhập hàng từ ${supplier_name}`,
            ref_id: resultId,
            created_at: import_date
        }, shopName);

        res.json({ success: true, id: resultId });
    } catch (error) {
        console.error('Create Import Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = createImport;

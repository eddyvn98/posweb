const db = require('../../db/connection');

function voidSale(req, res) {
    const { shop_id } = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ error: 'Missing void reason' });
    }

    const transaction = db.transaction(() => {
        // 1. Check if sale exists and belongs to shop
        const sale = db.prepare('SELECT id, is_void FROM sales WHERE id = ? AND shop_id = ?').get(id, shop_id);

        if (!sale) {
            throw new Error('Sale not found');
        }
        if (sale.is_void) {
            throw new Error('Sale already voided');
        }

        // 2. Update sale status
        db.prepare(`
            UPDATE sales 
            SET is_void = 1, void_reason = ?, void_at = ?
            WHERE id = ?
        `).run(reason, new Date().toISOString(), id);

        // 3. Reverse inventory (optional - if you want to restore stock)
        const items = db.prepare('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?').all(id);
        for (const item of items) {
            const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.product_id);
            if (product) {
                const newStock = product.stock_quantity + item.quantity;
                db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newStock, item.product_id);

                // Log inventory change
                const { v4: uuidv4 } = require('uuid');
                db.prepare(`
                    INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note)
                    VALUES (?, ?, ?, ?, ?, 'void', ?)
                `).run(uuidv4(), shop_id, item.product_id, item.quantity, newStock, `Huỷ đơn hàng ${id}`);
            }
        }

        // 4. Update cash flow (mark as invalid or create reversal)
        // Here we just update the existing cash flow to matches the voided status if needed, 
        // but usually we just filter out voided sales in reports.
        // Let's mark the source ref_id record in cash_flows if needed.
        db.prepare(`UPDATE cash_flows SET description = '[VOIDED] ' || description WHERE ref_id = ?`).run(id);

        return true;
    });

    try {
        transaction();

        // Đồng bộ Google Sheet (chạy ngầm)
        const shop = db.prepare('SELECT name FROM shops WHERE id = ?').get(shop_id);
        const { syncVoidSale } = require('../../services/googleSheetService');
        syncVoidSale(id, reason, shop ? shop.name : 'Cửa hàng');

        res.json({ success: true });
    } catch (error) {
        console.error('Void Sale Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

module.exports = voidSale;

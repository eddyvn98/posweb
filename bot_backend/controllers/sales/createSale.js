const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');

function createSale(req, res) {
    const { shop_id, id: user_id } = req.user;
    const sale = req.body;

    // Use transaction for data integrity
    const transaction = db.transaction(() => {
        // ... (existing transaction code)
        const saleId = sale.id || uuidv4();
        db.prepare(`
            INSERT INTO sales (id, shop_id, code, total_amount, payment_method, sale_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(saleId, shop_id, sale.code, sale.total_amount, sale.payment_method, sale.sale_date, user_id);

        if (sale.items && sale.items.length > 0) {
            for (const item of sale.items) {
                const itemId = uuidv4();
                db.prepare(`
                    INSERT INTO sale_items (id, sale_id, product_id, quantity, price, product_name)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(itemId, saleId, item.product_id, item.quantity, item.price, item.product_name);

                const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.product_id);
                const currentStock = product ? product.stock_quantity : 0;
                const newStock = currentStock - item.quantity;
                const logId = uuidv4();

                db.prepare(`
                    INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note)
                    VALUES (?, ?, ?, ?, ?, 'sale', 'Bán hàng')
                `).run(logId, shop_id, item.product_id, -item.quantity, newStock);

                db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newStock, item.product_id);
            }
        }

        const cashFlowId = uuidv4();
        db.prepare(`
            INSERT INTO cash_flows (id, shop_id, amount, type, category, description, ref_id, created_at)
            VALUES (?, ?, ?, 'in', 'sale', ?, ?, ?)
        `).run(
            cashFlowId,
            shop_id,
            sale.total_amount,
            `Thu tiền bán hàng đơn ${sale.code}`,
            saleId,
            sale.sale_date
        );

        return saleId;
    });

    try {
        const resultId = transaction();

        // Gửi dữ liệu sang Google Sheets (chạy ngầm, không đợi)
        const shop = db.prepare('SELECT name FROM shops WHERE id = ?').get(shop_id);
        const { syncSale, syncCashFlow } = require('../../services/googleSheetService');
        const shopName = shop ? shop.name : 'Cửa hàng';

        syncSale(sale, shopName);
        syncCashFlow({
            amount: sale.total_amount,
            type: 'in',
            category: 'sale',
            description: `Thu tiền bán hàng đơn ${sale.code}`,
            ref_id: saleId,
            created_at: sale.sale_date
        }, shopName);

        res.json({ success: true, id: resultId });
    } catch (error) {
        console.error('Create Sale Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = createSale;


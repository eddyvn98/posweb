const db = require('../../db/connection');

function upsertProduct(req, res) {
    try {
        const { shop_id } = req.user;
        const product = req.body;

        const stmt = db.prepare(`
            INSERT INTO products (id, shop_id, barcode, name, unit, category, price, cost_price, stock_quantity, image_url, is_active)
            VALUES (@id, @shop_id, @barcode, @name, @unit, @category, @price, @cost_price, @stock_quantity, @image_url, @is_active)
            ON CONFLICT(shop_id, barcode) DO UPDATE SET
                name = excluded.name,
                unit = excluded.unit,
                category = excluded.category,
                price = excluded.price,
                cost_price = excluded.cost_price,
                stock_quantity = excluded.stock_quantity,
                image_url = excluded.image_url,
                is_active = excluded.is_active
        `);

        stmt.run({
            ...product,
            unit: product.unit || 'Cái',
            shop_id,
            is_active: product.is_active ? 1 : 0
        });

        // Đồng bộ Google Sheet (chạy ngầm)
        const shop = db.prepare('SELECT name FROM shops WHERE id = ?').get(shop_id);
        const { syncProduct } = require('../../services/googleSheetService');
        syncProduct({ ...product, shop_id }, shop ? shop.name : 'Cửa hàng');

        res.json({ success: true });
    } catch (error) {
        console.error('Upsert Product Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = upsertProduct;

const db = require('../../db/connection');

function getSuppliers(req, res) {
    const { shop_id } = req.user;

    try {
        const suppliers = db.prepare(`
            SELECT *
            FROM suppliers
            WHERE shop_id = ?
            ORDER BY
                CASE WHEN TRIM(COALESCE(name, '')) = '' THEN 1 ELSE 0 END,
                LOWER(COALESCE(name, '')) ASC,
                updated_at DESC
        `).all(shop_id);

        res.json(suppliers);
    } catch (error) {
        console.error('Get Suppliers Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getSuppliers;

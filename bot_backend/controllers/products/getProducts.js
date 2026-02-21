const db = require('../../db/connection');

function getProducts(req, res) {
    try {
        const { shop_id } = req.user;
        const products = db.prepare(`
            SELECT * FROM products 
            WHERE shop_id = ? AND is_active = 1
            ORDER BY name ASC
        `).all(shop_id);

        res.json(products);
    } catch (error) {
        console.error('Get Products Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getProducts;

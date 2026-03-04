const db = require('../../db/connection');

function deleteProduct(req, res) {
    try {
        const { shop_id } = req.user;
        const { id } = req.params;

        const result = db.prepare(`
            UPDATE products
            SET is_active = 0
            WHERE id = ? AND shop_id = ?
        `).run(id, shop_id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = deleteProduct;

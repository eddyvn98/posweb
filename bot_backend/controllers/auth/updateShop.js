const db = require('../../db/connection');

function updateShop(req, res) {
    try {
        const { shop_id } = req.user;
        const { name, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const result = db.prepare(`
            UPDATE shops SET name = ?, address = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name, address, shop_id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        res.json({ success: true, message: 'Shop updated successfully' });
    } catch (error) {
        console.error('Update Shop Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = updateShop;

const db = require('../../db/connection');

function deleteSupplier(req, res) {
    const { shop_id } = req.user;
    const { id } = req.params;

    try {
        const result = db.prepare(`
            DELETE FROM suppliers
            WHERE id = ? AND shop_id = ?
        `).run(id, shop_id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete Supplier Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = deleteSupplier;

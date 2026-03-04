const db = require('../../db/connection');

function updateUnit(req, res) {
    try {
        const { shop_id } = req.user;
        const { id } = req.params;
        const name = (req.body?.name || '').trim();

        if (!name) {
            return res.status(400).json({ error: 'Unit name is required' });
        }

        const duplicate = db.prepare(`
            SELECT id FROM units
            WHERE shop_id = ?
              AND lower(name) = lower(?)
              AND id != ?
              AND is_active = 1
            LIMIT 1
        `).get(shop_id, name, id);

        if (duplicate) {
            return res.status(409).json({ error: 'Unit already exists' });
        }

        const result = db.prepare(`
            UPDATE units
            SET name = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND shop_id = ? AND is_active = 1
        `).run(name, id, shop_id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        res.json({ success: true, id, name });
    } catch (error) {
        console.error('Update Unit Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = updateUnit;

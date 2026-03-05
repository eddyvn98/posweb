const db = require('../../db/connection');

function deleteUnit(req, res) {
    try {
        const { shop_id } = req.user;
        const { id } = req.params;

        // Check if unit is in use
        const unit = db.prepare('SELECT name FROM units WHERE id = ? AND shop_id = ?').get(id, shop_id);
        if (!unit) return res.status(404).json({ error: 'Unit not found' });

        const inUse = db.prepare('SELECT id FROM products WHERE unit = ? AND shop_id = ? LIMIT 1').get(unit.name, shop_id);
        if (inUse) return res.status(400).json({ error: 'Không thể xóa đơn vị đang được sử dụng cho sản phẩm' });

        db.prepare('DELETE FROM units WHERE id = ? AND shop_id = ?').run(id, shop_id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Unit Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = deleteUnit;

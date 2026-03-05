const db = require('../../db/connection');

function deleteCategory(req, res) {
    try {
        const { shop_id } = req.user;
        const { id } = req.params;

        const category = db.prepare('SELECT name FROM categories WHERE id = ? AND shop_id = ?').get(id, shop_id);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        const inUse = db.prepare('SELECT id FROM products WHERE category = ? AND shop_id = ? LIMIT 1').get(category.name, shop_id);
        if (inUse) return res.status(400).json({ error: 'Không thể xóa nhóm hàng đang có sản phẩm' });

        db.prepare('DELETE FROM categories WHERE id = ? AND shop_id = ?').run(id, shop_id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Category Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = deleteCategory;

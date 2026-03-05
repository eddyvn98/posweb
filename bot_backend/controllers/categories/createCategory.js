const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');

function createCategory(req, res) {
    try {
        const { shop_id } = req.user;
        const { name } = req.body;

        if (!name) return res.status(400).json({ error: 'Name is required' });

        const id = uuidv4();
        db.prepare('INSERT INTO categories (id, shop_id, name) VALUES (?, ?, ?)').run(id, shop_id, name);

        const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        res.json(newCategory);
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Nhóm hàng đã tồn tại' });
        }
        console.error('Create Category Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = createCategory;

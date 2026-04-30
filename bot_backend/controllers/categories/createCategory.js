const { getCategoriesRepo } = require('../../repositories/categories.repo');

async function createCategory(req, res) {
    try {
        const { shop_id } = req.user;
        const name = (req.body?.name || '').trim();

        if (!name) return res.status(400).json({ error: 'Name is required' });

        const newCategory = await getCategoriesRepo().createCategory(shop_id, name);
        res.json(newCategory);
    } catch (error) {
        if (error.message === 'CATEGORY_EXISTS' || error.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Nhom hang da ton tai' });
        }
        console.error('Create Category Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = createCategory;

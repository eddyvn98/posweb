const { getCategoriesRepo } = require('../../repositories/categories.repo');

async function updateCategory(req, res) {
    try {
        const { shop_id } = req.user;
        const { id } = req.params;
        const name = (req.body?.name || '').trim();

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const ok = await getCategoriesRepo().updateCategory(shop_id, id, name);

        if (!ok) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ success: true, id, name });
    } catch (error) {
        if (error.message === 'CATEGORY_EXISTS') {
            return res.status(409).json({ error: 'Nhom hang da ton tai' });
        }
        console.error('Update Category Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = updateCategory;

const { getCategoriesRepo } = require('../../repositories/categories.repo');

async function deleteCategory(req, res) {
    try {
        const { shop_id } = req.user;
        const { id } = req.params;

        await getCategoriesRepo().deleteCategory(shop_id, id);
        res.json({ success: true });
    } catch (error) {
        if (error.message === 'Category not found') {
            return res.status(404).json({ error: 'Category not found' });
        }
        if (error.message === 'CATEGORY_IN_USE') {
            return res.status(400).json({ error: 'Khong the xoa nhom hang dang co san pham' });
        }
        console.error('Delete Category Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = deleteCategory;

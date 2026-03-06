const { getCategoriesRepo } = require('../../repositories/categories.repo');

async function getCategories(req, res) {
    try {
        const { shop_id } = req.user;
        const categories = await getCategoriesRepo().getCategories(shop_id);
        res.json(categories);
    } catch (error) {
        console.error('Get Categories Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getCategories;

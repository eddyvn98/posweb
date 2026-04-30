const { getProductsRepo } = require('../../repositories/products.repo');

async function getProducts(req, res) {
    try {
        const { shop_id } = req.user;
        const products = await getProductsRepo().getProducts(shop_id);

        res.json(products);
    } catch (error) {
        console.error('Get Products Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getProducts;

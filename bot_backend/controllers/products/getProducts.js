const { getProductsRepo } = require('../../repositories/products.repo');

async function getProducts(req, res) {
    try {
        const { shop_id } = req.user;
        let products = await getProductsRepo().getProducts(shop_id);
        
        // Hide cost_price for sales staff
        if (req.user.role === 'staff_sales') {
            products = products.map(p => {
                const { cost_price, ...rest } = p;
                return rest;
            });
        }

        res.json(products);
    } catch (error) {
        console.error('Get Products Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getProducts;

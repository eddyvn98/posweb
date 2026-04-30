const { getProductsRepo } = require('../../repositories/products.repo');

async function deleteProduct(req, res) {
    try {
        const { shop_id } = req.user;
        const { id } = req.params;

        const ok = await getProductsRepo().softDeleteProduct(shop_id, id);

        if (!ok) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = deleteProduct;

const { getProductsRepo } = require('../../repositories/products.repo');
const { getAuthRepo } = require('../../repositories/auth.repo');

async function upsertProduct(req, res) {
    try {
        const { shop_id } = req.user;
        const product = req.body;

        await getProductsRepo().upsertProduct(shop_id, product);

        const shop = await getAuthRepo().getShopById(shop_id);
        const { syncProduct } = require('../../services/googleSheetService');
        syncProduct({ ...product, shop_id }, shop ? shop.name : 'Cua hang');

        res.json({ success: true });
    } catch (error) {
        console.error('Upsert Product Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = upsertProduct;

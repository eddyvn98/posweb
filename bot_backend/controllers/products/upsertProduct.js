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
        if (error.status === 409 || error.code === 'BARCODE_CONFLICT') {
            return res.status(409).json({ error: 'Mã vạch đã thuộc về sản phẩm khác' });
        }
        if (error.status === 400) return res.status(400).json({ error: error.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = upsertProduct;

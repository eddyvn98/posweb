const { getProductsRepo } = require('../../repositories/products.repo');

async function bulkUpsert(req, res) {
    try {
        const { shop_id } = req.user;
        const products = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ error: 'Payload must be an array of products' });
        }

        const result = await getProductsRepo().bulkUpsert(shop_id, products);

        // Optional: Sync to Google Sheets in background if needed
        // For bulk, we might want a different strategy than syncing one-by-one
        // to avoid hitting API limits.

        res.json(result);
    } catch (error) {
        console.error('Bulk Upsert Products Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = bulkUpsert;

const { getSalesRepo } = require('../../repositories/sales.repo');
const { getAuthRepo } = require('../../repositories/auth.repo');

async function createSale(req, res) {
    const { shop_id, id: user_id } = req.user;
    const sale = req.body;

    try {
        const outcome = await getSalesRepo().createSale(shop_id, user_id, sale, { withMeta: true });
        const resultId = outcome.id;

        // Idempotent Sheets upsert is safe on both new sales and retries.
        const shop = await getAuthRepo().getShopById(shop_id);
        const { syncSale, syncCashFlow } = require('../../services/googleSheetService');
        const shopName = shop ? shop.name : 'Cua hang';

        await syncSale(sale, shopName);
        await syncCashFlow({
            amount: sale.total_amount,
            type: 'in',
            category: 'sale',
            description: `Thu tien ban hang don ${sale.code}`,
            ref_id: resultId,
            created_at: sale.sale_date
        }, shopName);

        res.json({ success: true, id: resultId });
    } catch (error) {
        console.error('Create Sale Error:', error);
        const status = [400, 403, 409].includes(error.status) ? error.status : 500;
        res.status(status).json({ error: status === 500 ? 'Internal Server Error' : error.message });
    }
}

module.exports = createSale;

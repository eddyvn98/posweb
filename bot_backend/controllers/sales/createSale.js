const { getSalesRepo } = require('../../repositories/sales.repo');
const { getAuthRepo } = require('../../repositories/auth.repo');

async function createSale(req, res) {
    const { shop_id, id: user_id } = req.user;
    const sale = req.body;

    try {
        const resultId = await getSalesRepo().createSale(shop_id, user_id, sale);

        const shop = await getAuthRepo().getShopById(shop_id);
        const { syncSale, syncCashFlow } = require('../../services/googleSheetService');
        const shopName = shop ? shop.name : 'Cua hang';

        syncSale(sale, shopName);
        syncCashFlow({
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
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = createSale;

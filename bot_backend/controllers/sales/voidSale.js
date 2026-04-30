const { getSalesRepo } = require('../../repositories/sales.repo');
const { getAuthRepo } = require('../../repositories/auth.repo');

async function voidSale(req, res) {
    const { shop_id } = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ error: 'Missing void reason' });
    }

    try {
        await getSalesRepo().voidSale(shop_id, id, reason);

        const shop = await getAuthRepo().getShopById(shop_id);
        const { syncVoidSale } = require('../../services/googleSheetService');
        syncVoidSale(id, reason, shop ? shop.name : 'Cua hang');

        res.json({ success: true });
    } catch (error) {
        console.error('Void Sale Error:', error);
        if (error.message === 'Sale not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Sale already voided') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

module.exports = voidSale;

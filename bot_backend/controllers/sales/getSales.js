const { getSalesRepo } = require('../../repositories/sales.repo');

async function getSales(req, res) {
    try {
        const { shop_id } = req.user;
        const { startDate, endDate } = req.query;
        const sales = await getSalesRepo().getSales(shop_id, startDate, endDate);
        res.json(sales);
    } catch (error) {
        console.error('Get Sales Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getSales;

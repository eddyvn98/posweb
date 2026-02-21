const db = require('../../db/connection');

function getSales(req, res) {
    try {
        const { shop_id } = req.user;
        const { startDate, endDate } = req.query;

        const sales = db.prepare(`
            SELECT * FROM sales 
            WHERE shop_id = ? 
            AND sale_date >= ? AND sale_date <= ?
            ORDER BY sale_date ASC
        `).all(shop_id, startDate, endDate);

        res.json(sales);
    } catch (error) {
        console.error('Get Sales Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getSales;

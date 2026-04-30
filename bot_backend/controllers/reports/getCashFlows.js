const db = require('../../db/connection');

function getCashFlows(req, res) {
    try {
        const { shop_id } = req.user;
        const { startDate, endDate } = req.query;

        const flows = db.prepare(`
            SELECT * FROM cash_flows 
            WHERE shop_id = ? 
            AND created_at >= ? AND created_at <= ?
            ORDER BY created_at ASC
        `).all(shop_id, startDate, endDate);

        res.json(flows);
    } catch (error) {
        console.error('Get CashFlows Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getCashFlows;

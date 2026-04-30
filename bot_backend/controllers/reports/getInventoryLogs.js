const db = require('../../db/connection');

function getInventoryLogs(req, res) {
    try {
        const { shop_id } = req.user;
        const { startDate, endDate } = req.query;

        const logs = db.prepare(`
            SELECT * FROM inventory_logs 
            WHERE shop_id = ? 
            AND created_at >= ? AND created_at <= ?
        `).all(shop_id, startDate, endDate);

        res.json(logs);
    } catch (error) {
        console.error('Get InventoryLogs Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getInventoryLogs;

const db = require('../../db/connection');

function getInventoryLogs(req, res) {
    try {
        const { shop_id } = req.user;
        const { startDate, endDate } = req.query;
        const safeStartDate = startDate || '1970-01-01T00:00:00.000Z';
        const safeEndDate = endDate || '2999-12-31T23:59:59.999Z';

        const logs = db.prepare(`
            SELECT * FROM inventory_logs 
            WHERE shop_id = ? 
            AND created_at >= ? AND created_at <= ?
        `).all(shop_id, safeStartDate, safeEndDate);

        res.json(logs);
    } catch (error) {
        console.error('Get InventoryLogs Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getInventoryLogs;

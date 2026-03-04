const { v4: uuidv4 } = require('uuid');
const db = require('../../db/connection');

const DEFAULT_UNITS = ['Cái', 'Hộp', 'Kg', 'Lon', 'Chai'];

function getUnits(req, res) {
    try {
        const { shop_id } = req.user;

        let units = db.prepare(`
            SELECT id, name
            FROM units
            WHERE shop_id = ? AND is_active = 1
            ORDER BY name COLLATE NOCASE ASC
        `).all(shop_id);

        if (units.length === 0) {
            const insertStmt = db.prepare(`
                INSERT OR IGNORE INTO units (id, shop_id, name, is_active)
                VALUES (?, ?, ?, 1)
            `);
            for (const unitName of DEFAULT_UNITS) {
                insertStmt.run(uuidv4(), shop_id, unitName);
            }

            units = db.prepare(`
                SELECT id, name
                FROM units
                WHERE shop_id = ? AND is_active = 1
                ORDER BY name COLLATE NOCASE ASC
            `).all(shop_id);
        }

        res.json(units);
    } catch (error) {
        console.error('Get Units Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getUnits;

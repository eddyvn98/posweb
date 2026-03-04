const { v4: uuidv4 } = require('uuid');
const db = require('../../db/connection');

function createUnit(req, res) {
    try {
        const { shop_id } = req.user;
        const name = (req.body?.name || '').trim();

        if (!name) {
            return res.status(400).json({ error: 'Unit name is required' });
        }

        const exists = db.prepare(`
            SELECT id FROM units
            WHERE shop_id = ?
              AND lower(name) = lower(?)
              AND is_active = 1
            LIMIT 1
        `).get(shop_id, name);

        if (exists) {
            return res.status(409).json({ error: 'Unit already exists' });
        }

        const newUnit = {
            id: uuidv4(),
            shop_id,
            name
        };

        db.prepare(`
            INSERT INTO units (id, shop_id, name, is_active)
            VALUES (@id, @shop_id, @name, 1)
        `).run(newUnit);

        res.status(201).json(newUnit);
    } catch (error) {
        console.error('Create Unit Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = createUnit;

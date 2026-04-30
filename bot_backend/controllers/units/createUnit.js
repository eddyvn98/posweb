const { getUnitsRepo } = require('../../repositories/units.repo');

async function createUnit(req, res) {
    try {
        const { shop_id } = req.user;
        const name = (req.body?.name || '').trim();

        if (!name) {
            return res.status(400).json({ error: 'Unit name is required' });
        }

        const newUnit = await getUnitsRepo().createUnit(shop_id, name);
        res.status(201).json(newUnit);
    } catch (error) {
        if (error.message === 'Unit already exists') {
            return res.status(409).json({ error: 'Unit already exists' });
        }
        console.error('Create Unit Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = createUnit;

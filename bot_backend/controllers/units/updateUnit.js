const { getUnitsRepo } = require('../../repositories/units.repo');

async function updateUnit(req, res) {
    try {
        const { shop_id } = req.user;
        const { id } = req.params;
        const name = (req.body?.name || '').trim();

        if (!name) {
            return res.status(400).json({ error: 'Unit name is required' });
        }

        const ok = await getUnitsRepo().updateUnit(shop_id, id, name);

        if (!ok) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        res.json({ success: true, id, name });
    } catch (error) {
        if (error.message === 'Unit already exists') {
            return res.status(409).json({ error: 'Unit already exists' });
        }
        console.error('Update Unit Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = updateUnit;

const { getUnitsRepo } = require('../../repositories/units.repo');

async function getUnits(req, res) {
    try {
        const { shop_id } = req.user;
        if (!shop_id) {
            return res.status(400).json({ error: 'Missing shop_id' });
        }

        const units = await getUnitsRepo().getUnits(shop_id);
        res.json(units);
    } catch (error) {
        console.error('Get Units Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getUnits;

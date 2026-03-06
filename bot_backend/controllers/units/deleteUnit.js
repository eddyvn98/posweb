const { getUnitsRepo } = require('../../repositories/units.repo');

async function deleteUnit(req, res) {
    try {
        const { shop_id } = req.user;
        const { id } = req.params;

        await getUnitsRepo().deleteUnit(shop_id, id);
        res.json({ success: true });
    } catch (error) {
        if (error.message === 'Unit not found') {
            return res.status(404).json({ error: 'Unit not found' });
        }
        if (error.message === 'UNIT_IN_USE') {
            return res.status(400).json({ error: 'Khong the xoa don vi dang duoc su dung cho san pham' });
        }
        console.error('Delete Unit Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = deleteUnit;

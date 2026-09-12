const { getAuthRepo } = require('../../repositories/auth.repo');

async function updateShop(req, res) {
    try {
        const { shop_id } = req.user;
        const {
            name,
            address,
            phone,
            zalo_url,
            opening_hours,
            pickup_available,
            delivery_note,
            shipping_fee,
            free_shipping_threshold,
            bank_name,
            bank_account,
            bank_owner,
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const updated = await getAuthRepo().updateShop(shop_id, {
            name,
            address,
            phone,
            zalo_url,
            opening_hours,
            pickup_available: pickup_available !== false,
            delivery_note,
            shipping_fee,
            free_shipping_threshold,
            bank_name,
            bank_account,
            bank_owner,
        });
        if (!updated) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        res.json({ success: true, message: 'Shop updated successfully' });
    } catch (error) {
        console.error('Update Shop Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = updateShop;

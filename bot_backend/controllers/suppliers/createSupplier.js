const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');

function normalizeSupplierPayload(body = {}) {
    return {
        name: (body.name || '').trim(),
        phone: (body.phone || '').trim(),
        address: (body.address || '').trim(),
        tax_code: (body.tax_code || '').trim(),
        bank_account: (body.bank_account || '').trim(),
        bank_name: (body.bank_name || '').trim(),
        note: (body.note || '').trim()
    };
}

function createSupplier(req, res) {
    const { shop_id } = req.user;
    const supplier = normalizeSupplierPayload(req.body);
    const id = uuidv4();

    try {
        db.prepare(`
            INSERT INTO suppliers (
                id, shop_id, name, phone, address, tax_code, bank_account, bank_name, note, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
            id,
            shop_id,
            supplier.name,
            supplier.phone || null,
            supplier.address || null,
            supplier.tax_code || null,
            supplier.bank_account || null,
            supplier.bank_name || null,
            supplier.note || null
        );

        res.json({ success: true, id });
    } catch (error) {
        console.error('Create Supplier Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = createSupplier;

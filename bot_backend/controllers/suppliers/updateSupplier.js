const db = require('../../db/connection');
const { ensureShopInSqlite } = require('../../lib/sqliteSync');

function normalizeSupplierPayload(body = {}) {
    return {
        name: (body.name || '').trim(),
        phone: (body.phone || '').trim(),
        address: (body.address || '').trim(),
        tax_code: (body.tax_code || '').trim(),
        bank_account: (body.bank_account || '').trim(),
        bank_name: (body.bank_name || '').trim(),
        note: (body.note || '').trim(),
        opening_debt: Number(body.opening_debt || 0)
    };
}

async function updateSupplier(req, res) {
    const { shop_id } = req.user;
    const { id } = req.params;
    const supplier = normalizeSupplierPayload(req.body);

    try {
        await ensureShopInSqlite(shop_id);
        const result = db.prepare(`
            UPDATE suppliers
            SET
                name = ?,
                phone = ?,
                address = ?,
                tax_code = ?,
                bank_account = ?,
                bank_name = ?,
                note = ?,
                opening_debt = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND shop_id = ?
        `).run(
            supplier.name,
            supplier.phone || null,
            supplier.address || null,
            supplier.tax_code || null,
            supplier.bank_account || null,
            supplier.bank_name || null,
            supplier.note || null,
            supplier.opening_debt,
            id,
            shop_id
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Update Supplier Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = updateSupplier;

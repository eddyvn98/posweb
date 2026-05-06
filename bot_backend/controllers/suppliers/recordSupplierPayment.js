const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');
const { ensureShopInSqlite } = require('../../lib/sqliteSync');

async function recordSupplierPayment(req, res) {
    const { shop_id } = req.user;
    const { supplier_id, amount, description, payment_date, payment_method } = req.body;

    if (!supplier_id || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await ensureShopInSqlite(shop_id);
        const supplier = db.prepare('SELECT id, name FROM suppliers WHERE id = ? AND shop_id = ?').get(supplier_id, shop_id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        const id = uuidv4();
        const createdAt = payment_date ? new Date(payment_date).toISOString() : new Date().toISOString();
        const columns = db.prepare('PRAGMA table_info(cash_flows)').all();
        const hasPaymentMethod = columns.some((c) => c.name === 'payment_method');

        if (hasPaymentMethod) {
            db.prepare(`
                INSERT INTO cash_flows (id, shop_id, supplier_id, amount, type, category, payment_method, description, created_at)
                VALUES (?, ?, ?, ?, 'out', 'supplier_payment', ?, ?, ?)
            `).run(
                id,
                shop_id,
                supplier_id,
                amount,
                payment_method || null,
                description || `Thanh toán công nợ nhà cung cấp ${supplier.name || ''}`.trim(),
                createdAt
            );
        } else {
            db.prepare(`
                INSERT INTO cash_flows (id, shop_id, supplier_id, amount, type, category, description, created_at)
                VALUES (?, ?, ?, ?, 'out', 'supplier_payment', ?, ?)
            `).run(
                id,
                shop_id,
                supplier_id,
                amount,
                description || `Thanh toán công nợ nhà cung cấp ${supplier.name || ''}`.trim(),
                createdAt
            );
        }

        res.json({ success: true, id });
    } catch (error) {
        console.error('Record Supplier Payment Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = recordSupplierPayment;

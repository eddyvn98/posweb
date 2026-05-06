const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');
const { ensureShopInSqlite } = require('../../lib/sqliteSync');

async function adjustSupplierDebt(req, res) {
    const { shop_id } = req.user;
    const { id } = req.params;
    const { amount, direction, reason, adjustment_date } = req.body || {};
    const normalizedAmount = Number(amount || 0);

    if (!normalizedAmount || normalizedAmount <= 0 || !['increase', 'decrease'].includes(direction)) {
        return res.status(400).json({ error: 'Invalid adjustment payload' });
    }
    if (!reason || String(reason).trim().length < 3) {
        return res.status(400).json({ error: 'Adjustment reason is required' });
    }

    try {
        await ensureShopInSqlite(shop_id);
        const supplier = db.prepare('SELECT id, name FROM suppliers WHERE id = ? AND shop_id = ?').get(id, shop_id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        const cashFlowId = uuidv4();
        const createdAt = adjustment_date ? new Date(adjustment_date).toISOString() : new Date().toISOString();
        const type = direction === 'increase' ? 'in' : 'out';

        db.prepare(`
            INSERT INTO cash_flows (id, shop_id, supplier_id, amount, type, category, description, created_at)
            VALUES (?, ?, ?, ?, ?, 'supplier_debt_adjustment', ?, ?)
        `).run(
            cashFlowId,
            shop_id,
            id,
            normalizedAmount,
            type,
            `Điều chỉnh công nợ NCC ${supplier.name || ''}: ${String(reason).trim()}`.trim(),
            createdAt
        );

        res.json({ success: true, id: cashFlowId });
    } catch (error) {
        console.error('Adjust Supplier Debt Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = adjustSupplierDebt;

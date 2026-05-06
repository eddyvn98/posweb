const db = require('../../db/connection');

function getSupplierLedger(req, res) {
    const { shop_id } = req.user;
    const { id } = req.params;
    const limit = Math.max(10, Math.min(300, Number(req.query.limit || 100)));

    try {
        const supplier = db.prepare(`
            SELECT id, name, opening_debt
            FROM suppliers
            WHERE id = ? AND shop_id = ?
        `).get(id, shop_id);

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        const rows = db.prepare(`
            SELECT
                i.id AS ref_id,
                i.import_date AS tx_date,
                'import' AS tx_type,
                COALESCE(i.total_cost, 0) AS increase_amount,
                COALESCE(i.paid_amount, 0) AS decrease_amount,
                i.invoice_number AS code,
                COALESCE(i.note, '') AS note
            FROM imports i
            WHERE i.shop_id = ? AND i.supplier_id = ? AND i.status = 'confirmed'

            UNION ALL

            SELECT
                c.id AS ref_id,
                SUBSTR(c.created_at, 1, 10) AS tx_date,
                CASE
                    WHEN c.category = 'supplier_payment' THEN 'payment'
                    WHEN c.category = 'supplier_debt_adjustment' THEN 'adjustment'
                    ELSE 'other'
                END AS tx_type,
                CASE
                    WHEN c.category = 'supplier_debt_adjustment' AND c.type = 'in' THEN COALESCE(c.amount, 0)
                    ELSE 0
                END AS increase_amount,
                CASE
                    WHEN c.category = 'supplier_payment' THEN COALESCE(c.amount, 0)
                    WHEN c.category = 'supplier_debt_adjustment' AND c.type = 'out' THEN COALESCE(c.amount, 0)
                    ELSE 0
                END AS decrease_amount,
                NULL AS code,
                COALESCE(c.description, '') AS note
            FROM cash_flows c
            WHERE c.shop_id = ?
              AND c.supplier_id = ?
              AND c.category IN ('supplier_payment', 'supplier_debt_adjustment')

            ORDER BY tx_date DESC, ref_id DESC
            LIMIT ?
        `).all(shop_id, id, shop_id, id, limit);

        let runningDebt = Number(supplier.opening_debt || 0);
        const sortedAsc = [...rows].sort((a, b) => {
            if (a.tx_date === b.tx_date) return String(a.ref_id).localeCompare(String(b.ref_id));
            return String(a.tx_date).localeCompare(String(b.tx_date));
        });

        const withBalance = sortedAsc.map((row) => {
            runningDebt += Number(row.increase_amount || 0);
            runningDebt -= Number(row.decrease_amount || 0);
            return { ...row, running_debt: runningDebt };
        });

        const responseItems = withBalance.reverse();
        const currentDebt = responseItems.length > 0
            ? responseItems[0].running_debt
            : Number(supplier.opening_debt || 0);

        res.json({
            supplier: {
                id: supplier.id,
                name: supplier.name,
                opening_debt: Number(supplier.opening_debt || 0),
                current_debt: currentDebt
            },
            items: responseItems
        });
    } catch (error) {
        console.error('Get Supplier Ledger Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getSupplierLedger;

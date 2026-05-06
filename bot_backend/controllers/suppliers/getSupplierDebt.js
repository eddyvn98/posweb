const db = require('../../db/connection');

function getSupplierDebt(req, res) {
    const { shop_id } = req.user;

    try {
        // Calculate debt summary per supplier
        // Total Debt = Opening Debt + (SUM(Imports Total Cost) - SUM(Imports Paid Amount)) - SUM(Independent Payments)
        
        const debtSummary = db.prepare(`
            WITH ImportDebt AS (
                SELECT 
                    supplier_id,
                    SUM(total_cost) as total_import_value,
                    SUM(paid_amount) as total_import_paid
                FROM imports
                WHERE shop_id = ? AND status = 'confirmed' AND supplier_id IS NOT NULL
                GROUP BY supplier_id
            ),
            PaymentDebt AS (
                SELECT
                    supplier_id,
                    SUM(amount) as total_independent_paid
                FROM cash_flows
                WHERE shop_id = ? AND category = 'supplier_payment' AND type = 'out' AND supplier_id IS NOT NULL
                GROUP BY supplier_id
            ),
            AdjustmentDebt AS (
                SELECT
                    supplier_id,
                    SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END) as total_adjust_increase,
                    SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END) as total_adjust_decrease
                FROM cash_flows
                WHERE shop_id = ? AND category = 'supplier_debt_adjustment' AND supplier_id IS NOT NULL
                GROUP BY supplier_id
            )
            SELECT 
                s.id,
                s.name,
                s.phone,
                COALESCE(s.opening_debt, 0) as opening_debt,
                COALESCE(i.total_import_value, 0) as total_import_value,
                COALESCE(i.total_import_paid, 0) as total_import_paid,
                COALESCE(p.total_independent_paid, 0) as total_independent_paid,
                COALESCE(a.total_adjust_increase, 0) as total_adjust_increase,
                COALESCE(a.total_adjust_decrease, 0) as total_adjust_decrease,
                (COALESCE(s.opening_debt, 0) + 
                 (COALESCE(i.total_import_value, 0) - COALESCE(i.total_import_paid, 0)) - 
                 COALESCE(p.total_independent_paid, 0) +
                 COALESCE(a.total_adjust_increase, 0) -
                 COALESCE(a.total_adjust_decrease, 0)) as current_debt
            FROM suppliers s
            LEFT JOIN ImportDebt i ON s.id = i.supplier_id
            LEFT JOIN PaymentDebt p ON s.id = p.supplier_id
            LEFT JOIN AdjustmentDebt a ON s.id = a.supplier_id
            WHERE s.shop_id = ?
            ORDER BY current_debt DESC, s.name ASC
        `).all(shop_id, shop_id, shop_id, shop_id);

        res.json(debtSummary);
    } catch (error) {
        console.error('Get Supplier Debt Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getSupplierDebt;

const db = require('../../db/connection');

function deleteSupplier(req, res) {
    const { shop_id } = req.user;
    const { id } = req.params;

    try {
        const supplier = db.prepare('SELECT id FROM suppliers WHERE id = ? AND shop_id = ?').get(id, shop_id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        const importCount = db.prepare(`
            SELECT COUNT(1) AS total
            FROM imports
            WHERE shop_id = ? AND supplier_id = ?
        `).get(shop_id, id)?.total || 0;

        const flowCount = db.prepare(`
            SELECT COUNT(1) AS total
            FROM cash_flows
            WHERE shop_id = ? AND supplier_id = ?
        `).get(shop_id, id)?.total || 0;

        if (importCount > 0 || flowCount > 0) {
            return res.status(400).json({
                error: 'Không thể xóa nhà cung cấp đã phát sinh nhập hàng hoặc công nợ'
            });
        }

        const result = db.prepare(`
            DELETE FROM suppliers
            WHERE id = ? AND shop_id = ?
        `).run(id, shop_id);

        res.json({ success: true });
    } catch (error) {
        console.error('Delete Supplier Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = deleteSupplier;

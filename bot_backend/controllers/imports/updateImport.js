const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');
const { syncImport } = require('../../services/googleSheetService');
const { ensureShopInSqlite } = require('../../lib/sqliteSync');

function normalizeImportPayload(body = {}) {
    const items = Array.isArray(body.items) ? body.items : [];
    const totalGoodsAmount = Number(body.total_goods_amount || 0);
    const totalVatAmount = Number(body.total_vat_amount || 0);
    const totalCost = Number(body.total_cost || (totalGoodsAmount + totalVatAmount));
    const paidAmount = Number(body.paid_amount || 0);

    return {
        import_date: body.import_date,
        supplier_id: body.supplier_id || null,
        supplier_name: String(body.supplier_name || '').trim(),
        supplier_tax_code: String(body.supplier_tax_code || '').trim(),
        invoice_number: String(body.invoice_number || '').trim(),
        invoice_date: body.invoice_date || null,
        invoice_type: body.invoice_type || 'no_invoice',
        payment_method: body.payment_method || 'unpaid',
        payment_date: body.payment_date || null,
        paid_amount: paidAmount,
        total_goods_amount: totalGoodsAmount,
        total_vat_amount: totalVatAmount,
        total_cost: totalCost,
        attachment_files: JSON.stringify(Array.isArray(body.attachment_files) ? body.attachment_files : []),
        status: body.status || 'draft',
        note: String(body.note || '').trim(),
        items: items.map((item) => ({
            id: item.id || uuidv4(),
            product_id: item.product_id || null,
            product_name: String(item.product_name || '').trim(),
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
            vat_amount: Number(item.vat_amount || 0),
            total_amount: Number(item.total_amount || 0)
        })).filter((item) => item.product_name && item.quantity > 0)
    };
}

async function updateImport(req, res) {
    const { shop_id } = req.user;
    const { id } = req.params;
    const payload = normalizeImportPayload(req.body);

    try {
        await ensureShopInSqlite(shop_id);

    if (!payload.import_date || payload.total_cost <= 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

        const supplierLabel = payload.supplier_name || 'khong ro nha cung cap';
        const transaction = db.transaction(() => {
            const importResult = db.prepare(`
                UPDATE imports
                SET
                    import_date = ?,
                    supplier_id = ?,
                    supplier_name = ?,
                    supplier_tax_code = ?,
                    invoice_number = ?,
                    invoice_date = ?,
                    invoice_type = ?,
                    payment_method = ?,
                    payment_date = ?,
                    paid_amount = ?,
                    total_goods_amount = ?,
                    total_vat_amount = ?,
                    attachment_files = ?,
                    status = ?,
                    total_cost = ?,
                    note = ?
                WHERE id = ? AND shop_id = ?
            `).run(
                payload.import_date,
                payload.supplier_id,
                payload.supplier_name,
                payload.supplier_tax_code || null,
                payload.invoice_number || null,
                payload.invoice_date || null,
                payload.invoice_type,
                payload.payment_method,
                payload.payment_date || null,
                payload.paid_amount,
                payload.total_goods_amount,
                payload.total_vat_amount,
                payload.attachment_files,
                payload.status,
                payload.total_cost,
                payload.note || null,
                id,
                shop_id
            );

            if (importResult.changes === 0) return false;

            db.prepare(`DELETE FROM import_items WHERE import_id = ?`).run(id);

            const insertItem = db.prepare(`
                INSERT INTO import_items (id, import_id, product_id, product_name, quantity, unit_price, vat_amount, total_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            payload.items.forEach((item) => {
                insertItem.run(
                    item.id,
                    id,
                    item.product_id,
                    item.product_name,
                    item.quantity,
                    item.unit_price,
                    item.vat_amount,
                    item.total_amount
                );
            });

            db.prepare(`
                UPDATE cash_flows
                SET amount = ?, description = ?, created_at = ?
                WHERE ref_id = ? AND shop_id = ? AND category = 'import'
            `).run(
                payload.total_cost,
                `Nhap hang tu ${supplierLabel}`,
                new Date(payload.import_date).toISOString(),
                id,
                shop_id
            );

            return true;
        });

        const updated = transaction();
        if (!updated) {
            return res.status(404).json({ error: 'Import not found' });
        }

        syncImport({
            id,
            ...payload,
            attachment_files: JSON.parse(payload.attachment_files || '[]')
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Update Import Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = updateImport;

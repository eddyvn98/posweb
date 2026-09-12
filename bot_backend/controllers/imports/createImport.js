const db = require('../../db/connection');
const { v4: uuidv4 } = require('uuid');
const { syncImport } = require('../../services/googleSheetService');

function normalizeImportPayload(body = {}) {
    const items = Array.isArray(body.items) ? body.items : [];
    const totalGoodsAmount = Number(body.total_goods_amount || 0);
    const totalVatAmount = Number(body.total_vat_amount || 0);
    const totalCost = Number(body.total_cost || (totalGoodsAmount + totalVatAmount));
    const paidAmount = Number(body.paid_amount || 0);

    return {
        import_date: body.import_date,
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

function createImport(req, res) {
    const { shop_id } = req.user;
    const payload = normalizeImportPayload(req.body);

    if (!payload.import_date || payload.total_cost <= 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const supplierLabel = payload.supplier_name || 'khong ro nha cung cap';

    const transaction = db.transaction(() => {
        const importId = uuidv4();

        db.prepare(`
            INSERT INTO imports (
                id, shop_id, import_date, supplier_name, supplier_tax_code, invoice_number, invoice_date,
                invoice_type, payment_method, payment_date, paid_amount, total_goods_amount, total_vat_amount,
                attachment_files, status, total_cost, note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            importId,
            shop_id,
            payload.import_date,
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
            payload.note || null
        );

        const insertItem = db.prepare(`
            INSERT INTO import_items (id, import_id, product_id, product_name, quantity, unit_price, vat_amount, total_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        payload.items.forEach((item) => {
            insertItem.run(
                item.id,
                importId,
                item.product_id,
                item.product_name,
                item.quantity,
                item.unit_price,
                item.vat_amount,
                item.total_amount
            );

            if (payload.status === 'confirmed' && item.product_id) {
                const prod = db.prepare('SELECT stock_quantity FROM products WHERE id = ? AND shop_id = ?').get(item.product_id, shop_id);
                if (prod) {
                    const newStock = Number(prod.stock_quantity || 0) + Number(item.quantity || 0);
                    db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ? AND shop_id = ?').run(newStock, item.product_id, shop_id);
                }
            }
        });

        const cashFlowId = uuidv4();
        db.prepare(`
            INSERT INTO cash_flows (id, shop_id, amount, type, category, description, ref_id, created_at)
            VALUES (?, ?, ?, 'out', 'import', ?, ?, ?)
        `).run(
            cashFlowId,
            shop_id,
            payload.total_cost,
            `Nhap hang tu ${supplierLabel}`,
            importId,
            new Date(payload.import_date).toISOString()
        );

        return importId;
    });

    try {
        const resultId = transaction();
        syncImport({
            id: resultId,
            ...payload,
            attachment_files: JSON.parse(payload.attachment_files || '[]')
        });
        res.json({ success: true, id: resultId });
    } catch (error) {
        console.error('Create Import Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = createImport;

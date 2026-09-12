const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { getDbProvider } = require('../db/provider');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

function orderFromRow(row, items = []) {
    return {
        id: row.id,
        code: row.code,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        status: row.status,
        paymentMethod: row.payment_method,
        note: row.note || '',
        customer: {
            name: row.customer_name,
            phone: row.customer_phone,
            email: row.customer_email || '',
        },
        address: {
            address: row.address,
            ward: row.ward || '',
            city: row.city,
        },
        subtotal: Number(row.subtotal_amount || row.total_amount || 0),
        voucher: row.voucher_code ? { code: row.voucher_code, discount: Number(row.voucher_discount || 0) } : null,
        voucherDiscount: Number(row.voucher_discount || 0),
        shippingFee: Number(row.shipping_amount || 0),
        total: Number(row.total_amount || 0),
        saleId: row.sale_id,
        items: items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: Number(item.price || 0),
            image_url: item.image_url || null,
        })),
    };
}

router.use(authenticateToken);

// GET /api/admin/online-orders - List orders with filter and search
router.get('/', (req, res) => {
    if (getDbProvider() !== 'sqlite') {
        return res.status(501).json({ error: 'Storefront orders require SQLite provider' });
    }

    const { shop_id } = req.user;
    const status = String(req.query.status || 'all').trim();
    const query = String(req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit) || 100, 200);

    try {
        let sql = 'SELECT * FROM online_orders WHERE shop_id = ?';
        const params = [shop_id];

        if (status !== 'all' && ['awaiting_shipment', 'completed', 'cancelled'].includes(status)) {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (query) {
            sql += ' AND (code LIKE ? OR customer_phone LIKE ? OR customer_name LIKE ?)';
            const qParam = `%${query}%`;
            params.push(qParam, qParam, qParam);
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const rows = db.prepare(sql).all(...params);

        let itemsByOrder = [];
        if (rows.length > 0) {
            const orderIds = rows.map((r) => r.id);
            const placeholders = orderIds.map(() => '?').join(',');
            itemsByOrder = db.prepare(`SELECT * FROM online_order_items WHERE order_id IN (${placeholders}) ORDER BY rowid ASC`).all(...orderIds);
        }

        const itemsGroup = new Map();
        itemsByOrder.forEach((item) => {
            if (!itemsGroup.has(item.order_id)) itemsGroup.set(item.order_id, []);
            itemsGroup.get(item.order_id).push(item);
        });

        // Calculate summary stats
        const statsRows = db.prepare(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(total_amount) as total_amount
            FROM online_orders 
            WHERE shop_id = ?
            GROUP BY status
        `).all(shop_id);

        const stats = {
            all: 0,
            awaiting_shipment: 0,
            completed: 0,
            cancelled: 0,
            revenue: 0,
        };

        statsRows.forEach((row) => {
            stats[row.status] = row.count;
            stats.all += row.count;
            if (row.status === 'completed') {
                stats.revenue += Number(row.total_amount || 0);
            }
        });

        res.json({
            orders: rows.map((row) => orderFromRow(row, itemsGroup.get(row.id) || [])),
            stats,
        });
    } catch (error) {
        console.error('Admin online orders list error:', error);
        res.status(500).json({ error: 'Unable to load online orders' });
    }
});

// GET /api/admin/online-orders/:id - Order detail
router.get('/:id', (req, res) => {
    if (getDbProvider() !== 'sqlite') {
        return res.status(501).json({ error: 'Storefront orders require SQLite provider' });
    }

    const { shop_id } = req.user;
    const { id } = req.params;

    try {
        const row = db.prepare('SELECT * FROM online_orders WHERE id = ? AND shop_id = ?').get(id, shop_id);
        if (!row) return res.status(404).json({ error: 'Order not found' });

        const items = db.prepare('SELECT * FROM online_order_items WHERE order_id = ? ORDER BY rowid ASC').all(id);
        res.json(orderFromRow(row, items));
    } catch (error) {
        console.error('Admin online order detail error:', error);
        res.status(500).json({ error: 'Unable to load order detail' });
    }
});

// PATCH /api/admin/online-orders/:id/status - Change status (complete or cancel)
router.patch('/:id/status', (req, res) => {
    if (getDbProvider() !== 'sqlite') {
        return res.status(501).json({ error: 'Storefront orders require SQLite provider' });
    }

    const { shop_id } = req.user;
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['awaiting_shipment', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid order status' });
    }

    try {
        const updated = db.transaction(() => {
            const order = db.prepare('SELECT * FROM online_orders WHERE id = ? AND shop_id = ?').get(id, shop_id);
            if (!order) throw new Error('Order not found');
            if (order.status === status) return order;

            const now = new Date().toISOString();

            // Handling transition to CANCELLED: restore stock and void sale
            if (status === 'cancelled' && order.status !== 'cancelled') {
                const items = db.prepare('SELECT product_id, quantity FROM online_order_items WHERE order_id = ?').all(order.id);
                const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND shop_id = ?');
                const insertLog = db.prepare('INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)');

                for (const item of items) {
                    updateStock.run(item.quantity, item.product_id, shop_id);
                    const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ? AND shop_id = ?').get(item.product_id, shop_id);
                    if (product) {
                        insertLog.run(uuidv4(), shop_id, item.product_id, item.quantity, product.stock_quantity, 'void', `Admin cancelled online order ${order.code}`);
                    }
                }

                if (order.sale_id) {
                    db.prepare('UPDATE sales SET is_void = 1, void_reason = ?, void_at = ? WHERE id = ? AND shop_id = ?')
                        .run(String(reason || 'Shop hủy đơn online').trim(), now, order.sale_id, shop_id);
                    db.prepare("UPDATE cash_flows SET description = '[VOIDED] ' || description WHERE ref_id = ? AND shop_id = ?")
                        .run(order.sale_id, shop_id);
                }
            }

            // Handling transition FROM CANCELLED back to active/completed: re-deduct stock
            if (order.status === 'cancelled' && (status === 'awaiting_shipment' || status === 'completed')) {
                const items = db.prepare('SELECT product_id, quantity FROM online_order_items WHERE order_id = ?').all(order.id);
                const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND shop_id = ?');
                const insertLog = db.prepare('INSERT INTO inventory_logs (id, shop_id, product_id, change_amount, current_stock, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)');

                for (const item of items) {
                    updateStock.run(item.quantity, item.product_id, shop_id);
                    const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ? AND shop_id = ?').get(item.product_id, shop_id);
                    if (product) {
                        insertLog.run(uuidv4(), shop_id, item.product_id, -item.quantity, product.stock_quantity, 'sale', `Admin restored online order ${order.code}`);
                    }
                }

                if (order.sale_id) {
                    db.prepare('UPDATE sales SET is_void = 0, void_reason = NULL, void_at = NULL WHERE id = ? AND shop_id = ?')
                        .run(order.sale_id, shop_id);
                    db.prepare("UPDATE cash_flows SET description = REPLACE(description, '[VOIDED] ', '') WHERE ref_id = ? AND shop_id = ?")
                        .run(order.sale_id, shop_id);
                }
            }

            db.prepare('UPDATE online_orders SET status = ?, updated_at = ? WHERE id = ? AND shop_id = ?')
                .run(status, now, order.id, shop_id);

            const row = db.prepare('SELECT * FROM online_orders WHERE id = ?').get(order.id);
            const items = db.prepare('SELECT * FROM online_order_items WHERE order_id = ? ORDER BY rowid ASC').all(order.id);
            return orderFromRow(row, items);
        })();

        res.json(updated);
    } catch (error) {
        console.error('Admin change order status error:', error);
        if (/not found/i.test(error.message)) return res.status(404).json({ error: error.message });
        res.status(500).json({ error: 'Unable to update order status' });
    }
});

module.exports = router;

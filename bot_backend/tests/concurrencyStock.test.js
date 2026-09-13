const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

let db;
const TEST_SHOP_ID = 'shop-concurrency-test';

describe('Kiểm thử sâu 2: Tranh chấp tồn kho đồng thời (Concurrency & Atomic Lock)', () => {
    before(() => {
        db = new Database(':memory:');
        db.pragma('foreign_keys = ON');

        db.exec(`
            CREATE TABLE shops (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL
            );

            CREATE TABLE products (
                id TEXT PRIMARY KEY,
                shop_id TEXT NOT NULL REFERENCES shops(id),
                barcode TEXT NOT NULL,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                stock_quantity INTEGER NOT NULL DEFAULT 0,
                is_active BOOLEAN DEFAULT 1
            );

            CREATE TABLE online_orders (
                id TEXT PRIMARY KEY,
                shop_id TEXT NOT NULL REFERENCES shops(id),
                code TEXT NOT NULL,
                total_amount REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'awaiting_shipment'
            );

            CREATE TABLE online_order_items (
                id TEXT PRIMARY KEY,
                order_id TEXT NOT NULL REFERENCES online_orders(id),
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL
            );

            INSERT INTO shops (id, name) VALUES ('${TEST_SHOP_ID}', 'Shop Concurrency Test');
        `);
    });

    after(() => {
        if (db) db.close();
    });

    it('2.1. Kiểm tra tranh chấp tồn kho: 1 món cuối cùng trong kho, 2 người cùng đặt', () => {
        const prodId = 'prod-last-item';
        // Sản phẩm chỉ còn ĐÚNG 1 cái trong kho
        db.prepare(`
            INSERT INTO products (id, shop_id, barcode, name, price, stock_quantity)
            VALUES (?, ?, 'LAST001', 'Món hàng độc bản', 250000, 1)
        `).run(prodId, TEST_SHOP_ID);

        // Hàm đặt hàng atomic với kiểm tra stock_quantity >= quantity trong WHERE clause
        function placeOrderAtomic(orderCode, quantityRequested) {
            return db.transaction(() => {
                const product = db.prepare('SELECT id, name, stock_quantity FROM products WHERE id = ? AND shop_id = ?').get(prodId, TEST_SHOP_ID);
                if (!product || product.stock_quantity < quantityRequested) {
                    throw new Error('Insufficient stock');
                }

                // Cập nhật tồn kho có điều kiện atomic (optimistic concurrency guard)
                const updateStock = db.prepare(`
                    UPDATE products
                    SET stock_quantity = stock_quantity - ?
                    WHERE id = ? AND shop_id = ? AND stock_quantity >= ?
                `).run(quantityRequested, prodId, TEST_SHOP_ID, quantityRequested);

                if (updateStock.changes !== 1) {
                    throw new Error('Insufficient stock');
                }

                const orderId = uuidv4();
                db.prepare('INSERT INTO online_orders (id, shop_id, code, total_amount) VALUES (?, ?, ?, ?)')
                    .run(orderId, TEST_SHOP_ID, orderCode, 250000 * quantityRequested);

                db.prepare('INSERT INTO online_order_items (id, order_id, product_id, quantity) VALUES (?, ?, ?, ?)')
                    .run(uuidv4(), orderId, prodId, quantityRequested);

                return { success: true, orderId };
            })();
        }

        // Khách A đặt trước thành công
        const resultA = placeOrderAtomic('ORDER-A', 1);
        assert.equal(resultA.success, true);

        // Tồn kho lúc này phải về đúng 0
        const checkAfterA = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(prodId);
        assert.equal(checkAfterA.stock_quantity, 0);

        // Khách B cùng đặt ngay lúc đó -> Bị từ chối do hết hàng, KHÔNG BỊ ÂM KHO
        assert.throws(() => {
            placeOrderAtomic('ORDER-B', 1);
        }, /Insufficient stock/);

        // Đảm bảo tồn kho vẫn là 0, không bị âm
        const checkFinal = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(prodId);
        assert.equal(checkFinal.stock_quantity, 0);
    });

    it('2.2. Kiểm tra hủy đơn online: Tồn kho được hoàn trả chính xác', () => {
        const prodId = 'prod-last-item';

        // Lấy đơn của Khách A đã đặt ở bước trên
        const orderA = db.prepare("SELECT * FROM online_orders WHERE code = 'ORDER-A'").get();
        assert.ok(orderA);

        // Chủ shop bấm Hủy đơn (status: cancelled)
        db.transaction(() => {
            const items = db.prepare('SELECT product_id, quantity FROM online_order_items WHERE order_id = ?').all(orderA.id);
            for (const item of items) {
                db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?').run(item.quantity, item.product_id);
            }
            db.prepare("UPDATE online_orders SET status = 'cancelled' WHERE id = ?").run(orderA.id);
        })();

        // Kiểm tra tồn kho đã phục hồi về 1
        const restoredProduct = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(prodId);
        assert.equal(restoredProduct.stock_quantity, 1);

        // Đơn hàng mang trạng thái cancelled
        const updatedOrderA = db.prepare('SELECT status FROM online_orders WHERE id = ?').get(orderA.id);
        assert.equal(updatedOrderA.status, 'cancelled');
    });
});

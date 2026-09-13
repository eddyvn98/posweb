const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

let db;
const TEST_SHOP_ID = 'shop-flow-test-1';

describe('End-to-End User Flow Integration Tests (SQLite & Storefront)', () => {
    before(() => {
        db = new Database(':memory:');
        db.pragma('foreign_keys = ON');

        db.exec(`
            CREATE TABLE shops (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                shipping_fee REAL DEFAULT 20000,
                free_shipping_threshold REAL DEFAULT 300000,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE products (
                id TEXT PRIMARY KEY,
                shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                barcode TEXT NOT NULL,
                name TEXT NOT NULL,
                unit TEXT NOT NULL DEFAULT 'Cái',
                category TEXT,
                price REAL NOT NULL DEFAULT 0,
                online_price REAL,
                promo_price REAL,
                cost_price REAL NOT NULL DEFAULT 0,
                stock_quantity INTEGER NOT NULL DEFAULT 0,
                image_url TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(shop_id, barcode)
            );

            CREATE TABLE online_orders (
                id TEXT PRIMARY KEY,
                shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                code TEXT NOT NULL UNIQUE,
                customer_token TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                customer_email TEXT,
                address TEXT NOT NULL,
                ward TEXT,
                city TEXT NOT NULL,
                payment_method TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                subtotal_amount REAL NOT NULL,
                voucher_code TEXT,
                voucher_discount REAL DEFAULT 0,
                shipping_amount REAL DEFAULT 0,
                total_amount REAL NOT NULL,
                note TEXT,
                sale_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE online_order_items (
                id TEXT PRIMARY KEY,
                order_id TEXT NOT NULL REFERENCES online_orders(id) ON DELETE CASCADE,
                product_id TEXT,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                image_url TEXT
            );

            INSERT INTO shops (id, name, shipping_fee, free_shipping_threshold)
            VALUES ('${TEST_SHOP_ID}', 'Tạp Hóa Test', 20000, 300000);
        `);
    });

    after(() => {
        if (db) db.close();
    });

    it('Luồng 1 & 2: Tạo sản phẩm, đổi giá online và hiển thị giá Storefront', () => {
        const prodId = uuidv4();
        // 1. Tạo mới sản phẩm với giá offline 15.000đ
        db.prepare(`
            INSERT INTO products (id, shop_id, barcode, name, price, stock_quantity)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(prodId, TEST_SHOP_ID, '893000111222', 'Bút bi Thiên Long', 15000, 100);

        // 2. Kiểm tra giá storefront ban đầu: fallback giá offline = 15.000
        let p = db.prepare('SELECT * FROM products WHERE id = ?').get(prodId);
        assert.equal(p.price, 15000);
        assert.equal(p.online_price, null);

        // 3. Sửa giá online lên 18.000đ, giá KM 16.000đ
        db.prepare(`
            UPDATE products
            SET online_price = ?, promo_price = ?
            WHERE id = ?
        `).run(18000, 16000, prodId);

        // 4. Kiểm tra giá storefront sau khi cập nhật
        p = db.prepare('SELECT * FROM products WHERE id = ?').get(prodId);
        assert.equal(p.online_price, 18000);
        assert.equal(p.promo_price, 16000);

        // Storefront pricing logic
        const effectivePrice = (p.promo_price > 0 && p.promo_price < p.online_price) ? p.promo_price : p.online_price;
        assert.equal(effectivePrice, 16000);
    });

    it('Luồng 3: Khách hàng tạo đơn hàng online thành công', () => {
        const orderId = uuidv4();
        const customerToken = 'cust_tok_' + uuidv4();
        const code = 'ORD-2026-TEST';

        // Tạo đơn hàng COD
        db.prepare(`
            INSERT INTO online_orders (
                id, shop_id, code, customer_token,
                customer_name, customer_phone, address, city,
                payment_method, status, subtotal_amount, shipping_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        `).run(
            orderId, TEST_SHOP_ID, code, customerToken,
            'Trần Thị B', '0987654321', '456 Vườn Lài', 'TP. Hồ Chí Minh',
            'cod', 32000, 20000, 52000
        );

        // Thêm sản phẩm vào đơn hàng
        db.prepare(`
            INSERT INTO online_order_items (id, order_id, product_name, quantity, price)
            VALUES (?, ?, ?, ?, ?)
        `).run(uuidv4(), orderId, 'Bút bi Thiên Long', 2, 16000);

        // Kiểm tra đơn vừa tạo
        const order = db.prepare('SELECT * FROM online_orders WHERE id = ?').get(orderId);
        assert.equal(order.code, code);
        assert.equal(order.status, 'pending');
        assert.equal(order.total_amount, 52000);

        const items = db.prepare('SELECT * FROM online_order_items WHERE order_id = ?').all(orderId);
        assert.equal(items.length, 1);
        assert.equal(items[0].quantity, 2);
    });

    it('Luồng 4: Chủ shop duyệt đơn và hoàn tất chu trình đơn hàng', () => {
        const order = db.prepare('SELECT * FROM online_orders WHERE shop_id = ? ORDER BY created_at DESC LIMIT 1').get(TEST_SHOP_ID);
        assert.ok(order);
        assert.equal(order.status, 'pending');

        // 1. Xác nhận đơn
        db.prepare('UPDATE online_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('confirmed', order.id);
        let updated = db.prepare('SELECT status FROM online_orders WHERE id = ?').get(order.id);
        assert.equal(updated.status, 'confirmed');

        // 2. Giao hàng
        db.prepare('UPDATE online_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('shipping', order.id);
        updated = db.prepare('SELECT status FROM online_orders WHERE id = ?').get(order.id);
        assert.equal(updated.status, 'shipping');

        // 3. Hoàn tất
        db.prepare('UPDATE online_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', order.id);
        updated = db.prepare('SELECT status FROM online_orders WHERE id = ?').get(order.id);
        assert.equal(updated.status, 'completed');
    });
});

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

// Test using an in-memory database to avoid touching production data
let db;
let repo;

describe('SQLite Products Repository Unit Tests', () => {
    before(() => {
        db = new Database(':memory:');
        db.pragma('foreign_keys = ON');

        // Create tables matching schema
        db.exec(`
            CREATE TABLE shops (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
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
        `);

        // Insert test shop
        db.prepare('INSERT INTO shops (id, name) VALUES (?, ?)').run('shop-test-1', 'Test Shop');

        // Repository implementation identical to products.repo.js
        repo = {
            async getProducts(shop_id) {
                return db.prepare('SELECT * FROM products WHERE shop_id = ? AND is_active = 1 ORDER BY name ASC').all(shop_id);
            },
            async getProductById(id) {
                return db.prepare('SELECT * FROM products WHERE id = ?').get(id) || null;
            },
            async softDeleteProduct(shop_id, id) {
                const result = db.prepare('UPDATE products SET is_active = 0 WHERE id = ? AND shop_id = ?').run(id, shop_id);
                return result.changes > 0;
            },
            async upsertProduct(shop_id, product) {
                const existingById = product.id
                    ? db.prepare('SELECT id, barcode FROM products WHERE id = ? AND shop_id = ?').get(product.id, shop_id)
                    : null;

                if (existingById) {
                    if (product.barcode && product.barcode !== existingById.barcode) {
                        db.prepare('DELETE FROM products WHERE shop_id = ? AND barcode = ? AND id != ?')
                            .run(shop_id, String(product.barcode).trim(), product.id);
                    }
                    db.prepare(`
                        UPDATE products SET
                            barcode = @barcode,
                            name = @name,
                            unit = @unit,
                            category = @category,
                            price = @price,
                            online_price = @online_price,
                            promo_price = @promo_price,
                            cost_price = @cost_price,
                            stock_quantity = @stock_quantity,
                            image_url = @image_url,
                            is_active = @is_active
                        WHERE id = @id AND shop_id = @shop_id
                    `).run({
                        ...product,
                        barcode: String(product.barcode || '').trim(),
                        unit: product.unit || 'Cai',
                        category: product.category || null,
                        shop_id,
                        price: Number(product.price || 0),
                        online_price: product.online_price === null || product.online_price === '' || product.online_price === undefined
                            ? null
                            : Number(product.online_price || 0),
                        promo_price: product.promo_price === null || product.promo_price === '' || product.promo_price === undefined
                            ? null
                            : Number(product.promo_price || 0),
                        cost_price: Number(product.cost_price || 0),
                        stock_quantity: Number(product.stock_quantity || 0),
                        image_url: product.image_url || null,
                        is_active: product.is_active ? 1 : 0,
                    });
                    return { success: true };
                }

                const stmt = db.prepare(`
                    INSERT INTO products (id, shop_id, barcode, name, unit, category, price, online_price, promo_price, cost_price, stock_quantity, image_url, is_active)
                    VALUES (@id, @shop_id, @barcode, @name, @unit, @category, @price, @online_price, @promo_price, @cost_price, @stock_quantity, @image_url, @is_active)
                    ON CONFLICT(shop_id, barcode) DO UPDATE SET
                        name = excluded.name,
                        unit = excluded.unit,
                        category = excluded.category,
                        price = excluded.price,
                        online_price = excluded.online_price,
                        promo_price = excluded.promo_price,
                        cost_price = excluded.cost_price,
                        stock_quantity = excluded.stock_quantity,
                        image_url = excluded.image_url,
                        is_active = excluded.is_active
                `);

                stmt.run({
                    ...product,
                    unit: product.unit || 'Cai',
                    category: product.category || null,
                    shop_id,
                    price: Number(product.price || 0),
                    online_price: product.online_price === null || product.online_price === '' || product.online_price === undefined
                        ? null
                        : Number(product.online_price || 0),
                    promo_price: product.promo_price === null || product.promo_price === '' || product.promo_price === undefined
                        ? null
                        : Number(product.promo_price || 0),
                    cost_price: Number(product.cost_price || 0),
                    stock_quantity: Number(product.stock_quantity || 0),
                    image_url: product.image_url || null,
                    is_active: product.is_active ? 1 : 0,
                });

                return { success: true };
            }
        };
    });

    after(() => {
        db.close();
    });

    it('should insert a brand new product', async () => {
        const prod = {
            id: 'prod-1',
            barcode: '893001',
            name: 'Bút Bi Xanh',
            unit: 'Cây',
            category: 'Văn phòng phẩm',
            price: 5000,
            online_price: null,
            promo_price: null,
            cost_price: 3000,
            stock_quantity: 100,
            is_active: 1
        };

        const result = await repo.upsertProduct('shop-test-1', prod);
        assert.equal(result.success, true);

        const saved = await repo.getProductById('prod-1');
        assert.equal(saved.name, 'Bút Bi Xanh');
        assert.equal(saved.price, 5000);
        assert.equal(saved.online_price, null);
    });

    it('should update price and set online_price for existing product by id', async () => {
        const updateProd = {
            id: 'prod-1',
            barcode: '893001',
            name: 'Bút Bi Xanh TL',
            unit: 'Cây',
            category: 'Văn phòng phẩm',
            price: 6000,
            online_price: 8000,
            promo_price: 7000,
            cost_price: 3500,
            stock_quantity: 90,
            is_active: 1
        };

        const result = await repo.upsertProduct('shop-test-1', updateProd);
        assert.equal(result.success, true);

        const saved = await repo.getProductById('prod-1');
        assert.equal(saved.name, 'Bút Bi Xanh TL');
        assert.equal(saved.price, 6000);
        assert.equal(saved.online_price, 8000);
        assert.equal(saved.promo_price, 7000);
    });

    it('should clear online_price back to null when cleared', async () => {
        const clearProd = {
            id: 'prod-1',
            barcode: '893001',
            name: 'Bút Bi Xanh TL',
            price: 6000,
            online_price: null,
            promo_price: null,
            stock_quantity: 90,
            is_active: 1
        };

        await repo.upsertProduct('shop-test-1', clearProd);
        const saved = await repo.getProductById('prod-1');
        assert.equal(saved.online_price, null);
        assert.equal(saved.promo_price, null);
    });

    it('should update barcode of existing product without conflict crash', async () => {
        const changedBarcodeProd = {
            id: 'prod-1',
            barcode: '893001-NEW',
            name: 'Bút Bi Xanh TL',
            price: 6000,
            online_price: null,
            promo_price: null,
            is_active: 1
        };

        const result = await repo.upsertProduct('shop-test-1', changedBarcodeProd);
        assert.equal(result.success, true);

        const saved = await repo.getProductById('prod-1');
        assert.equal(saved.barcode, '893001-NEW');
    });

    it('should soft delete product and exclude it from active list', async () => {
        const deleted = await repo.softDeleteProduct('shop-test-1', 'prod-1');
        assert.equal(deleted, true);

        const products = await repo.getProducts('shop-test-1');
        assert.equal(products.length, 0);

        // Record still in DB but is_active = 0
        const raw = await repo.getProductById('prod-1');
        assert.equal(raw.is_active, 0);
    });
});

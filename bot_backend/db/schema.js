const db = require('./connection');
const fs = require('fs');
const path = require('path');

function columnExists(tableName, columnName) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some((column) => column.name === columnName);
}

function runMigrations() {
    try {
        if (!columnExists('products', 'unit')) {
            db.exec("ALTER TABLE products ADD COLUMN unit TEXT NOT NULL DEFAULT 'Cái'");
            console.log('Migrated: products.unit');
        }

        if (!columnExists('products', 'category')) {
            db.exec("ALTER TABLE products ADD COLUMN category TEXT");
            console.log('Migrated: products.category');
        }

        // Migration: Make sale_items.product_id nullable for Quick Sales
        const saleItemsInfo = db.prepare("PRAGMA table_info(sale_items)").all();
        const productIdCol = saleItemsInfo.find(c => c.name === 'product_id');
        if (productIdCol && productIdCol.notnull === 1) {
            console.log('Migrating sale_items.product_id to be nullable...');
            db.exec(`
                PRAGMA foreign_keys=OFF;
                CREATE TABLE sale_items_new (
                    id TEXT PRIMARY KEY,
                    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
                    product_id TEXT,
                    quantity INTEGER NOT NULL,
                    price REAL NOT NULL,
                    product_name TEXT NOT NULL
                );
                INSERT INTO sale_items_new SELECT * FROM sale_items;
                DROP TABLE sale_items;
                ALTER TABLE sale_items_new RENAME TO sale_items;
                PRAGMA foreign_keys=ON;
            `);
            console.log('Migrated: sale_items.product_id is now nullable');
        }

        db.exec(`
            CREATE TABLE IF NOT EXISTS units (
              id TEXT PRIMARY KEY,
              shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              is_active BOOLEAN DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME,
              UNIQUE(shop_id, name)
            );

            CREATE TABLE IF NOT EXISTS categories (
              id TEXT PRIMARY KEY,
              shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              is_active BOOLEAN DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME,
              UNIQUE(shop_id, name)
            );
        `);
    } catch (err) {
        console.error('Error running migrations:', err.message);
    }
}

function seedDefaults() {
    try {
        const shops = db.prepare("SELECT id FROM shops").all();
        const defaultUnits = ['Cái', 'Tờ', 'Sấp', 'Block'];
        const defaultCategories = ['Văn phòng phẩm', 'Đồ chơi', 'Vật dụng'];

        // Cleanup unwanted units
        db.exec("DELETE FROM units WHERE LOWER(name) IN ('lon', 'hộp', 'chai', 'kg')");

        const insertUnit = db.prepare("INSERT OR IGNORE INTO units (id, shop_id, name) VALUES (?, ?, ?)");
        const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (id, shop_id, name) VALUES (?, ?, ?)");
        const { v4: uuidv4 } = require('uuid');

        shops.forEach(shop => {
            defaultUnits.forEach(unit => {
                insertUnit.run(uuidv4(), shop.id, unit);
            });
            defaultCategories.forEach(cat => {
                insertCategory.run(uuidv4(), shop.id, cat);
            });
        });
        console.log('Default units and categories seeded.');
    } catch (err) {
        console.error('Error seeding defaults:', err.message);
    }
}

function initSchema() {
    const initSqlPath = path.resolve(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    try {
        db.exec(initSql);
        runMigrations();
        seedDefaults();
        console.log('Database schema initialized successfully');
    } catch (err) {
        console.error('Error initializing schema:', err.message);
    }
}

module.exports = { initSchema };

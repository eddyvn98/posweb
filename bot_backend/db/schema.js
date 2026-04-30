const db = require('./connection');
const fs = require('fs');
const path = require('path');

function columnExists(tableName, columnName) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some((column) => column.name === columnName);
}

function addColumnIfMissing(tableName, columnName, definition) {
    if (!columnExists(tableName, columnName)) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
        console.log(`Migrated: ${tableName}.${columnName}`);
    }
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

        addColumnIfMissing('imports', 'supplier_tax_code', 'TEXT');
        addColumnIfMissing('imports', 'invoice_number', 'TEXT');
        addColumnIfMissing('imports', 'invoice_date', 'TEXT');
        addColumnIfMissing('imports', 'invoice_type', "TEXT DEFAULT 'no_invoice'");
        addColumnIfMissing('imports', 'payment_method', "TEXT DEFAULT 'unpaid'");
        addColumnIfMissing('imports', 'payment_date', 'TEXT');
        addColumnIfMissing('imports', 'paid_amount', 'REAL NOT NULL DEFAULT 0');
        addColumnIfMissing('imports', 'total_goods_amount', 'REAL NOT NULL DEFAULT 0');
        addColumnIfMissing('imports', 'total_vat_amount', 'REAL NOT NULL DEFAULT 0');
        addColumnIfMissing('imports', 'attachment_files', 'TEXT');
        addColumnIfMissing('imports', 'status', "TEXT DEFAULT 'draft'");

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

            CREATE TABLE IF NOT EXISTS suppliers (
              id TEXT PRIMARY KEY,
              shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
              name TEXT NOT NULL DEFAULT '',
              phone TEXT,
              address TEXT,
              tax_code TEXT,
              bank_account TEXT,
              bank_name TEXT,
              note TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS import_items (
              id TEXT PRIMARY KEY,
              import_id TEXT NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
              product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
              product_name TEXT NOT NULL,
              quantity REAL NOT NULL DEFAULT 0,
              unit_price REAL NOT NULL DEFAULT 0,
              vat_amount REAL NOT NULL DEFAULT 0,
              total_amount REAL NOT NULL DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

function initSchema(options = {}) {
    const shouldSeedDefaults = options.seedDefaults !== false;
    const initSqlPath = path.resolve(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    try {
        db.exec(initSql);
        runMigrations();
        if (shouldSeedDefaults) {
            seedDefaults();
        }
        console.log('Database schema initialized successfully');
    } catch (err) {
        console.error('Error initializing schema:', err.message);
    }
}

module.exports = { initSchema };

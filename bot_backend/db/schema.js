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
        `);
    } catch (err) {
        console.error('Error running migrations:', err.message);
    }
}

function initSchema() {
    const initSqlPath = path.resolve(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    try {
        db.exec(initSql);
        runMigrations();
        console.log('Database schema initialized successfully');
    } catch (err) {
        console.error('Error initializing schema:', err.message);
    }
}

module.exports = { initSchema };

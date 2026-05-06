const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../bot_backend/pos.db');
const db = new Database(dbPath);

console.log('Starting migration...');

try {
    // Add feature_flags to shops
    try {
        db.prepare('ALTER TABLE shops ADD COLUMN feature_flags TEXT DEFAULT "{}"').run();
        console.log('Added feature_flags to shops');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('feature_flags already exists in shops');
        } else {
            throw e;
        }
    }

    // Add opening_debt to suppliers
    try {
        db.prepare('ALTER TABLE suppliers ADD COLUMN opening_debt REAL DEFAULT 0').run();
        console.log('Added opening_debt to suppliers');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('opening_debt already exists in suppliers');
        } else {
            throw e;
        }
    }

    // Add supplier_id to imports
    try {
        db.prepare('ALTER TABLE imports ADD COLUMN supplier_id TEXT REFERENCES suppliers(id)').run();
        console.log('Added supplier_id to imports');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('supplier_id already exists in imports');
        } else {
            throw e;
        }
    }

    // Link existing imports to suppliers by name
    const updateImports = db.transaction(() => {
        const suppliers = db.prepare('SELECT id, name, shop_id FROM suppliers').all();
        const stmt = db.prepare('UPDATE imports SET supplier_id = ? WHERE supplier_name = ? AND shop_id = ? AND supplier_id IS NULL');
        
        let count = 0;
        suppliers.forEach(s => {
            const res = stmt.run(s.id, s.name, s.shop_id);
            count += res.changes;
        });
        return count;
    });

    const linkedCount = updateImports();
    console.log(`Linked ${linkedCount} existing imports to suppliers`);

    console.log('Migration completed successfully');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
} finally {
    db.close();
}

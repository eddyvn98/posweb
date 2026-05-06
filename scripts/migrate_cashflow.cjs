const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../bot_backend/pos.db');
const db = new Database(dbPath);

console.log('Starting migration for cash_flows...');

try {
    // Add supplier_id to cash_flows
    try {
        db.prepare('ALTER TABLE cash_flows ADD COLUMN supplier_id TEXT REFERENCES suppliers(id)').run();
        console.log('Added supplier_id to cash_flows');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('supplier_id already exists in cash_flows');
        } else {
            throw e;
        }
    }

    console.log('Migration completed successfully');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
} finally {
    db.close();
}

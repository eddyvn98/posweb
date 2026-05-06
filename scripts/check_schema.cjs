const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../bot_backend/pos.db');
const db = new Database(dbPath);

const tables = ['suppliers'];

tables.forEach(table => {
    try {
        const schema = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`).get();
        console.log(`\n--- Schema for ${table} ---`);
        console.log(schema ? schema.sql : 'Table not found');
        
        const triggers = db.prepare(`SELECT * FROM sqlite_master WHERE type='trigger' AND tbl_name='${table}'`).all();
        console.log(`\nTriggers for ${table}:`);
        console.table(triggers);
    } catch (e) {
        console.error(`Error checking ${table}:`, e.message);
    }
});

db.close();

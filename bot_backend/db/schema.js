const db = require('./connection');
const fs = require('fs');
const path = require('path');

function initSchema() {
    const initSqlPath = path.resolve(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    // Split by semicolon and filter out empty strings
    // better-sqlite3 exec handles multiple statements
    try {
        db.exec(initSql);
        console.log('✅ Database schema initialized successfully');
    } catch (err) {
        console.error('❌ Error initializing schema:', err.message);
    }
}

module.exports = { initSchema };

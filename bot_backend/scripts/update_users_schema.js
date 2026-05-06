const db = require('../db/connection');

try {
    db.prepare("ALTER TABLE users ADD COLUMN reset_password_token TEXT").run();
    db.prepare("ALTER TABLE users ADD COLUMN reset_password_expires TEXT").run();
    console.log("✅ Users table updated successfully");
} catch (err) {
    if (err.message.includes("duplicate column name")) {
        console.log("ℹ️ Columns already exist");
    } else {
        console.error("❌ Error updating table:", err.message);
    }
}
process.exit(0);

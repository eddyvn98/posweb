const db = require('../../db/connection');

function safeParseJson(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function getImports(req, res) {
    const { shop_id } = req.user;

    try {
        const imports = db.prepare(`
            SELECT * FROM imports 
            WHERE shop_id = ? 
            ORDER BY import_date DESC, created_at DESC
        `).all(shop_id);

        res.json(imports.map((record) => ({
            ...record,
            attachment_files: safeParseJson(record.attachment_files, [])
        })));
    } catch (error) {
        console.error('Get Imports Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getImports;

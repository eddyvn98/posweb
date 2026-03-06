const db = require('../../db/connection');

function safeParseJson(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function getImportById(req, res) {
    const { shop_id } = req.user;
    const { id } = req.params;

    try {
        const importRecord = db.prepare(`
            SELECT *
            FROM imports
            WHERE id = ? AND shop_id = ?
        `).get(id, shop_id);

        if (!importRecord) {
            return res.status(404).json({ error: 'Import not found' });
        }

        const items = db.prepare(`
            SELECT *
            FROM import_items
            WHERE import_id = ?
            ORDER BY created_at ASC
        `).all(id);

        res.json({
            ...importRecord,
            attachment_files: safeParseJson(importRecord.attachment_files, []),
            items
        });
    } catch (error) {
        console.error('Get Import By Id Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = getImportById;

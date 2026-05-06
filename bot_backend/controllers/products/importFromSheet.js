const { pullProductsFromSheet } = require('../../services/googleSheetService');
const { getProductsRepo } = require('../../repositories/products.repo');
const { v4: uuidv4 } = require('uuid');

async function importFromSheet(req, res) {
    try {
        const { shop_id } = req.user;
        const { spreadsheetId } = req.body;

        if (!spreadsheetId) {
            return res.status(400).json({ error: 'spreadsheetId is required' });
        }

        const items = await pullProductsFromSheet(spreadsheetId);
        
        if (items.length === 0) {
            return res.status(400).json({ error: 'No valid products found in sheet' });
        }

        const productsWithIds = items.map(item => ({
            ...item,
            id: uuidv4(),
            is_active: true
        }));

        const result = await getProductsRepo().bulkUpsert(shop_id, productsWithIds);

        res.json({
            success: true,
            count: result.count,
            message: `Successfully imported ${result.count} products from Google Sheet`
        });
    } catch (error) {
        console.error('Import From Sheet Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

module.exports = importFromSheet;

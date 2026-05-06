const { syncFromShopSheet } = require('../../services/importsSheetService');

async function syncImportsFromSheet(req, res) {
  try {
    const { shop_id } = req.user;
    const result = await syncFromShopSheet(shop_id);
    res.json({ success: true, ...result, message: `Synced ${result.count} rows from Google Sheet` });
  } catch (error) {
    console.error('Sync Imports From Sheet Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

module.exports = syncImportsFromSheet;

const { getShopsRepo } = require('../../repositories/shops.repo');
const { ensureShopImportsSheet } = require('../../services/importsSheetService');

async function getImportsSheetLink(req, res) {
  try {
    const { shop_id } = req.user;
    const shop = await getShopsRepo().getById(shop_id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    if (!shop.imports_sheet_id || !shop.imports_sheet_url) {
      const created = await ensureShopImportsSheet(shop_id);
      return res.json({ spreadsheetId: created.spreadsheetId, spreadsheetUrl: created.spreadsheetUrl, created: true });
    }

    res.json({
      spreadsheetId: shop.imports_sheet_id,
      spreadsheetUrl: shop.imports_sheet_url,
      created: false
    });
  } catch (error) {
    console.error('Get Imports Sheet Link Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

module.exports = getImportsSheetLink;

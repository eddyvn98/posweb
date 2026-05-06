const { getAuthRepo } = require('../repositories/auth.repo');

const FEATURE_KEY = 'supplier_debt_management';

function parseFeatureFlags(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function requireSupplierDebtFeature(req, res, next) {
  const { shop_id } = req.user || {};
  if (!shop_id) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const shop = await getAuthRepo().getShopById(shop_id);
    const flags = parseFeatureFlags(shop?.feature_flags);
    if (!flags[FEATURE_KEY]) {
      return res.status(403).json({ error: 'Supplier debt feature is disabled for this shop' });
    }
    next();
  } catch (error) {
    console.error('Supplier debt feature guard error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = { requireSupplierDebtFeature, FEATURE_KEY };

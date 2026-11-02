const { getSalesRepo } = require('../../repositories/sales.repo');
async function voidSale(req, res) {
  const { shop_id } = req.user;
  const { id } = req.params;
  const { reason } = req.body || {};
  if (!reason) return res.status(400).json({ error: 'Missing void reason' });
  try {
    await getSalesRepo().voidSale(shop_id, id, reason, { withMeta: true, allowAlreadyVoided: true });
    res.json({ success: true });
  } catch (error) {
    if (error.message === 'Sale not found') return res.status(404).json({ error: error.message });
    console.error('Void Sale Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
module.exports = voidSale;

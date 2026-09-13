const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getStorefrontRepo } = require('../repositories/storefront.repo');

router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json(await getStorefrontRepo().listOrders(req.user.shop_id));
  } catch (error) {
    console.error('List Web Orders Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const status = String(req.body?.status || '');
    if (!['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await getStorefrontRepo().updateOrderStatus(req.user.shop_id, req.params.id, status, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Update Web Order Status Error:', error);
    res.status(400).json({ error: error.message || 'Unable to update order' });
  }
});

module.exports = router;

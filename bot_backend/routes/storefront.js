const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getStorefrontRepo } = require('../repositories/storefront.repo');

router.get('/templates', authenticateToken, async (_req, res) => {
  try {
    res.json(await getStorefrontRepo().listTemplates());
  } catch (error) {
    console.error('List Storefront Templates Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/settings', authenticateToken, async (req, res) => {
  try {
    res.json(await getStorefrontRepo().getSettings(req.user.shop_id));
  } catch (error) {
    console.error('Get Storefront Settings Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.patch('/settings', authenticateToken, async (req, res) => {
  try {
    res.json(await getStorefrontRepo().updateSettings(req.user.shop_id, req.body || {}));
  } catch (error) {
    console.error('Update Storefront Settings Error:', error);
    res.status(400).json({ error: error.message || 'Unable to update storefront settings' });
  }
});

router.post('/publish', authenticateToken, async (req, res) => {
  try {
    res.json(await getStorefrontRepo().publish(req.user.shop_id));
  } catch (error) {
    console.error('Publish Storefront Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:slug/products/:productId', async (req, res) => {
  try {
    const detail = await getStorefrontRepo().getPublicProductDetail(req.params.slug, req.params.productId);
    if (!detail) return res.status(404).json({ error: 'Product not found' });
    res.json(detail);
  } catch (error) {
    console.error('Get Public Storefront Product Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const storefront = await getStorefrontRepo().getPublicBySlug(req.params.slug);
    if (!storefront) return res.status(404).json({ error: 'Storefront not found' });
    res.json(storefront);
  } catch (error) {
    console.error('Get Public Storefront Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/:slug/orders', async (req, res) => {
  try {
    const order = await getStorefrontRepo().createOrder(req.params.slug, req.body || {});
    if (!order) return res.status(404).json({ error: 'Storefront not found' });
    res.status(201).json(order);
  } catch (error) {
    console.error('Create Web Order Error:', error);
    res.status(400).json({ error: error.message || 'Unable to create order' });
  }
});

module.exports = router;

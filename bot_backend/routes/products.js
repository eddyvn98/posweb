const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getProducts = require('../controllers/products/getProducts');
const upsertProduct = require('../controllers/products/upsertProduct');

router.get('/', authenticateToken, getProducts);
router.post('/upsert', authenticateToken, upsertProduct);

module.exports = router;

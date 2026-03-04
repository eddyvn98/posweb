const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getProducts = require('../controllers/products/getProducts');
const upsertProduct = require('../controllers/products/upsertProduct');
const deleteProduct = require('../controllers/products/deleteProduct');

router.get('/', authenticateToken, getProducts);
router.post('/upsert', authenticateToken, upsertProduct);
router.delete('/:id', authenticateToken, deleteProduct);

module.exports = router;

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getProducts = require('../controllers/products/getProducts');
const upsertProduct = require('../controllers/products/upsertProduct');
const deleteProduct = require('../controllers/products/deleteProduct');
const uploadImage = require('../controllers/products/uploadImage');

router.get('/', authenticateToken, getProducts);
router.post('/upsert', authenticateToken, upsertProduct);
router.post('/upload-image', authenticateToken, uploadImage);
router.delete('/:id', authenticateToken, deleteProduct);

module.exports = router;

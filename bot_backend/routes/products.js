const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const getProducts = require('../controllers/products/getProducts');
const upsertProduct = require('../controllers/products/upsertProduct');
const deleteProduct = require('../controllers/products/deleteProduct');
const uploadImage = require('../controllers/products/uploadImage');
const bulkUpsert = require('../controllers/products/bulkUpsert');
const importFromSheet = require('../controllers/products/importFromSheet');
const getImportsSheetLink = require('../controllers/products/getImportsSheetLink');
const syncImportsFromSheet = require('../controllers/products/syncImportsFromSheet');

router.get('/', authenticateToken, getProducts);
router.post('/upsert', authenticateToken, upsertProduct);
router.post('/bulk-upsert', authenticateToken, bulkUpsert);
router.post('/import-sheet', authenticateToken, importFromSheet);
router.get('/imports-sheet-link', authenticateToken, getImportsSheetLink);
router.post('/imports-sheet-sync', authenticateToken, syncImportsFromSheet);
router.post('/upload-image', authenticateToken, uploadImage);
router.delete('/:id', authenticateToken, deleteProduct);

module.exports = router;

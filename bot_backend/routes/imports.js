const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getImports = require('../controllers/imports/getImports');
const getImportById = require('../controllers/imports/getImportById');
const createImport = require('../controllers/imports/createImport');
const updateImport = require('../controllers/imports/updateImport');

router.get('/', authenticateToken, getImports);
router.get('/:id', authenticateToken, getImportById);
router.post('/', authenticateToken, createImport);
router.put('/:id', authenticateToken, updateImport);

module.exports = router;

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getImports = require('../controllers/imports/getImports');
const createImport = require('../controllers/imports/createImport');

router.get('/', authenticateToken, getImports);
router.post('/', authenticateToken, createImport);

module.exports = router;

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const createSale = require('../controllers/sales/createSale');
const getSales = require('../controllers/sales/getSales');

router.get('/', authenticateToken, getSales);
router.post('/', authenticateToken, createSale);

module.exports = router;

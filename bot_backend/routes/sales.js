const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const createSale = require('../controllers/sales/createSale');
const getSales = require('../controllers/sales/getSales');
const voidSale = require('../controllers/sales/voidSale');

router.get('/', authenticateToken, getSales);
router.post('/', authenticateToken, createSale);
router.post('/:id/void', authenticateToken, voidSale);

module.exports = router;

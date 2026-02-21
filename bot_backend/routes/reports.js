const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getCashFlows = require('../controllers/reports/getCashFlows');
const getInventoryLogs = require('../controllers/reports/getInventoryLogs');

router.get('/cash-flows', authenticateToken, getCashFlows);
router.get('/inventory-logs', authenticateToken, getInventoryLogs);

module.exports = router;

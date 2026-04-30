const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getCashFlows = require('../controllers/reports/getCashFlows');
const getInventoryLogs = require('../controllers/reports/getInventoryLogs');
const { sendBackupToTelegram } = require('../services/backupService');

router.get('/cash-flows', authenticateToken, getCashFlows);
router.get('/inventory-logs', authenticateToken, getInventoryLogs);

router.post('/backup', authenticateToken, async (req, res) => {
    const result = await sendBackupToTelegram();
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

module.exports = router;

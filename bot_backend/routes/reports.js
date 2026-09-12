const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getCashFlows = require('../controllers/reports/getCashFlows');
const getInventoryLogs = require('../controllers/reports/getInventoryLogs');
const { createLocalBackup, sendBackupToTelegram } = require('../services/backupService');

router.get('/cash-flows', authenticateToken, getCashFlows);
router.get('/inventory-logs', authenticateToken, getInventoryLogs);

router.post('/backup', authenticateToken, async (req, res) => {
    const localResult = await createLocalBackup({ maxBackups: 30 });
    let telegramResult = { success: false, error: 'Telegram backup skipped or failed' };
    if (localResult.success) {
        telegramResult = await sendBackupToTelegram(localResult.filePath, localResult.fileName);
    }
    if (localResult.success) {
        res.json({
            success: true,
            local: localResult,
            telegram: telegramResult
        });
    } else {
        res.status(500).json({
            success: false,
            error: localResult.error || 'Backup failed'
        });
    }
});

module.exports = router;

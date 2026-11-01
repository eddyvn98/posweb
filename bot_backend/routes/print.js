const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { printReceipt, getInstalledPrinters, DEFAULT_PRINTER } = require('../services/printService');

// Check printer status & list
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const printers = await getInstalledPrinters();
        const target = printers.find(p => p.Name === DEFAULT_PRINTER) || null;
        res.json({
            defaultPrinter: DEFAULT_PRINTER,
            connected: Boolean(target),
            targetPrinter: target,
            printers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger print receipt
router.post('/receipt', authenticateToken, async (req, res) => {
    try {
        const { sale, shop, printerName } = req.body;
        if (!sale) {
            return res.status(400).json({ error: 'Missing sale data' });
        }

        const result = await printReceipt({
            sale,
            shop,
            printerName: printerName || DEFAULT_PRINTER
        });

        res.json(result);
    } catch (error) {
        console.error('[Print Receipt Route Error]', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

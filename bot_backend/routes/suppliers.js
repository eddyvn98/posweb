const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const getSuppliers = require('../controllers/suppliers/getSuppliers');
const createSupplier = require('../controllers/suppliers/createSupplier');
const bulkUpsertSuppliers = require('../controllers/suppliers/bulkUpsertSuppliers');
const updateSupplier = require('../controllers/suppliers/updateSupplier');
const deleteSupplier = require('../controllers/suppliers/deleteSupplier');
const getSupplierDebt = require('../controllers/suppliers/getSupplierDebt');
const recordSupplierPayment = require('../controllers/suppliers/recordSupplierPayment');
const getSupplierLedger = require('../controllers/suppliers/getSupplierLedger');
const adjustSupplierDebt = require('../controllers/suppliers/adjustSupplierDebt');
const { requireSupplierDebtFeature } = require('../middleware/supplierDebtFeature');

router.get('/', authenticateToken, getSuppliers);
router.post('/', authenticateToken, createSupplier);
router.post('/bulk-upsert', authenticateToken, bulkUpsertSuppliers);
router.get('/debt', authenticateToken, requireSupplierDebtFeature, getSupplierDebt);
router.post('/payments', authenticateToken, requireSupplierDebtFeature, recordSupplierPayment);
router.get('/:id/ledger', authenticateToken, requireSupplierDebtFeature, getSupplierLedger);
router.post('/:id/adjust-debt', authenticateToken, requireSupplierDebtFeature, adjustSupplierDebt);
router.put('/:id', authenticateToken, updateSupplier);
router.delete('/:id', authenticateToken, deleteSupplier);

module.exports = router;

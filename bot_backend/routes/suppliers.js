const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getSuppliers = require('../controllers/suppliers/getSuppliers');
const createSupplier = require('../controllers/suppliers/createSupplier');
const updateSupplier = require('../controllers/suppliers/updateSupplier');
const deleteSupplier = require('../controllers/suppliers/deleteSupplier');

router.get('/', authenticateToken, getSuppliers);
router.post('/', authenticateToken, createSupplier);
router.put('/:id', authenticateToken, updateSupplier);
router.delete('/:id', authenticateToken, deleteSupplier);

module.exports = router;

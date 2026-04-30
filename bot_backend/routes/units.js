const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getUnits = require('../controllers/units/getUnits');
const createUnit = require('../controllers/units/createUnit');
const updateUnit = require('../controllers/units/updateUnit');
const deleteUnit = require('../controllers/units/deleteUnit');

router.get('/', authenticateToken, getUnits);
router.post('/', authenticateToken, createUnit);
router.patch('/:id', authenticateToken, updateUnit);
router.delete('/:id', authenticateToken, deleteUnit);

module.exports = router;

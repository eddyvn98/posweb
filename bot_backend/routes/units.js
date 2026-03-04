const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getUnits = require('../controllers/units/getUnits');
const createUnit = require('../controllers/units/createUnit');
const updateUnit = require('../controllers/units/updateUnit');

router.get('/', authenticateToken, getUnits);
router.post('/', authenticateToken, createUnit);
router.patch('/:id', authenticateToken, updateUnit);

module.exports = router;

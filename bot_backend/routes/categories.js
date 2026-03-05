const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getCategories = require('../controllers/categories/getCategories');
const createCategory = require('../controllers/categories/createCategory');
const deleteCategory = require('../controllers/categories/deleteCategory');

router.get('/', authenticateToken, getCategories);
router.post('/', authenticateToken, createCategory);
router.delete('/:id', authenticateToken, deleteCategory);

module.exports = router;

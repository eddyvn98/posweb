const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const getCategories = require('../controllers/categories/getCategories');
const createCategory = require('../controllers/categories/createCategory');
const updateCategory = require('../controllers/categories/updateCategory');
const deleteCategory = require('../controllers/categories/deleteCategory');

router.get('/', authenticateToken, getCategories);
router.post('/', authenticateToken, createCategory);
router.patch('/:id', authenticateToken, updateCategory);
router.delete('/:id', authenticateToken, deleteCategory);

module.exports = router;

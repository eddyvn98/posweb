const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const uploadDocument = require('../controllers/files/uploadDocument');
const getTelegramFile = require('../controllers/files/getTelegramFile');

router.post('/upload-document', authenticateToken, uploadDocument);
router.get('/tg', authenticateToken, getTelegramFile);
router.get('/tg/:fileId', authenticateToken, getTelegramFile);

module.exports = router;

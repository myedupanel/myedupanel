const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const classController = require('../controllers/classController');
router.get('/', authMiddleware, classController.getClasses);
module.exports = router;
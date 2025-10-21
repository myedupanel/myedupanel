const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { updateSchoolName } = require('../controllers/userController');

// @route   PUT /api/users/school-name
router.put('/school-name', authMiddleware, updateSchoolName);

module.exports = router;
// File: backend/routes/planRoutes.js
const express = require('express');
const router = express.Router();
const { getPublicPlans } = require('../controllers/planController');
// const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/plans
// @desc    Sabhi public plans (prices) ko fetch karein
// @access  Public
router.get('/', getPublicPlans);

// Yahaan hum baad mein (SuperAdmin ke liye) POST / PUT routes add karenge

module.exports = router;
// File: backend/routes/couponRoutes.js

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { createCoupon, getAllCoupons } = require('../controllers/couponController');

// @route   POST /api/coupons
// @desc    Naya coupon banana (Sirf SuperAdmin)
// @access  Private (SuperAdmin)
router.post(
  '/',
  [authMiddleware, authorize('SuperAdmin')],
  createCoupon
);

// @route   GET /api/coupons
// @desc    Saare coupons dekhna (Sirf SuperAdmin)
// @access  Private (SuperAdmin)
router.get(
  '/',
  [authMiddleware, authorize('SuperAdmin')],
  getAllCoupons
);

module.exports = router;
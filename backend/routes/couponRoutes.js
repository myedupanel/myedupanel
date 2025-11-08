// File: backend/routes/couponRoutes.js (Poora updated code)

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
// Naye functions import karein
const { 
  createCoupon, 
  getAllCoupons, 
  updateCoupon, 
  deleteCoupon 
} = require('../controllers/couponController');

// Middleware
const superAdminAuth = [authMiddleware, authorize('SuperAdmin')];

// @route   POST /api/coupons
// @desc    Naya coupon banana
router.post('/', superAdminAuth, createCoupon);

// @route   GET /api/coupons
// @desc    Saare coupons dekhna
router.get('/', superAdminAuth, getAllCoupons);

// @route   PUT /api/coupons/:id
// @desc    Ek coupon ko update karna
router.put('/:id', superAdminAuth, updateCoupon);

// @route   DELETE /api/coupons/:id
// @desc    Ek coupon ko delete karna
router.delete('/:id', superAdminAuth, deleteCoupon);

module.exports = router;
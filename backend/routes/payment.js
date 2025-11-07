// File: backend/routes/payment.js

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const { 
    createSubscriptionOrder, 
    verifySubscriptionWebhook,
    validateCoupon // === NAYA FUNCTION IMPORT KAREIN ===
} = require('../controllers/paymentController');

// --- Route 1: Create Order (Bina Badlaav) ---
router.post(
    '/create-order', 
    [authMiddleware, authorize('Admin')],
    createSubscriptionOrder
);

// --- Route 2: Verify Webhook (Bina Badlaav) ---
router.post(
    '/webhook-verify', 
    verifySubscriptionWebhook
);

// === NAYA ROUTE (STEP 1) ===
// @route   POST /api/payment/validate-coupon
// @desc    Coupon code ko validate karta hai aur naya price batata hai
// @access  Private (Sirf Admin)
router.post(
    '/validate-coupon',
    [authMiddleware, authorize('Admin')],
    validateCoupon
);
// === END NAYA ROUTE ===

module.exports = router;
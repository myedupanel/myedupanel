// File: backend/routes/payment.js (UPDATED)

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const { 
    createSubscriptionOrder, 
    verifySubscriptionWebhook,
    validateCoupon,
    syncRazorpayPayments // === NAYA FUNCTION IMPORT KAREIN ===
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

// --- Route 3: Validate Coupon (Bina Badlaav) ---
router.post(
    '/validate-coupon',
    [authMiddleware, authorize('Admin')],
    validateCoupon
);

// === NAYA ROUTE (STEP 2) ===
// @route   POST /api/payment/sync-payments
// @desc    Razorpay se puraane phanse hue payments ko sync karta hai
// @access  Private (Sirf SuperAdmin)
router.post(
    '/sync-payments',
    [authMiddleware, authorize('SuperAdmin')], // Sirf SuperAdmin ise chala sakta hai
    syncRazorpayPayments
);
// === END NAYA ROUTE ===

module.exports = router;
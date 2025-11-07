// File: backend/routes/payment.js

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Controller se dono functions ko import karein
const { 
    createSubscriptionOrder, 
    verifySubscriptionWebhook 
} = require('../controllers/paymentController');

// --- Route 1: Frontend ke liye (Order Banana) ---
router.post(
    '/create-order', 
    [authMiddleware, authorize('Admin')], // 'SuperAdmin' authorize() mein pehle se handled hai
    createSubscriptionOrder
);

// --- Route 2: Razorpay ke liye (Payment Verify Karna) ---
router.post(
    '/webhook-verify', 
    verifySubscriptionWebhook // Yeh line 30 hai (ya uske aaspaas)
);

module.exports = router;
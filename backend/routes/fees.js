// File: backend/routes/fees.js (UPDATED)

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
// --- FIX: Naya "Premium" lock import karein ---
const checkPremiumAccess = require('../middleware/checkPremiumAccess');
const { getFeeRecords, addFeePayment } = require('../controllers/feeController'); // (Controller ka naam example hai)

// --- FIX: Ab sirf SuperAdmin ya PRO plan waale hi access kar sakte hain ---
router.get('/', [authMiddleware, authorize('Admin'), checkPremiumAccess], getFeeRecords);
router.post('/', [authMiddleware, authorize('Admin'), checkPremiumAccess], addFeePayment);

// ... (Baaki fee routes) ...

module.exports = router;
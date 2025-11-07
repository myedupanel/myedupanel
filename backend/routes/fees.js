// File: backend/routes/fees.js (FIXED)

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const checkPremiumAccess = require('../middleware/checkPremiumAccess');

// --- FIX: getFeeRecords को getStudentFeeRecords से बदला गया ---
// --- FIX: addFeePayment को collectManualFee या assignAndCollectFee से बदला गया ---
const { 
    getStudentFeeRecords, // <--- Correct function from controller
    collectManualFee      // <--- Assuming POST '/' is for collecting fees
} = require('../controllers/feeController'); 

// FIX: router.get('/') अब getStudentFeeRecords को कॉल करेगा
router.get('/', [authMiddleware, authorize('Admin'), checkPremiumAccess], getStudentFeeRecords);

// FIX: router.post('/') अब collectManualFee को कॉल करेगा (यह 'addFeePayment' के बजाय है)
router.post('/', [authMiddleware, authorize('Admin'), checkPremiumAccess], collectManualFee);

// ... (Baaki fee routes) ...

module.exports = router;
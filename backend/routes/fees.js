// File: backend/routes/fees.js (POORI TARAH FIX KIYA GAYA)

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const checkPremiumAccess = require('../middleware/checkPremiumAccess');

// === FIX 1: Missing functions ko import karein ===
const { 
    getDashboardOverview,
    getFeeTemplates,
    getTemplateDetails,
    getLatePayments,
    calculateLateFees,
    collectManualFee,
    getStudentFeeRecords,
    assignAndCollectFee, // <-- YEH MISSING THA
    getTransactions,     // <-- YEH MISSING THA
    // (Baaki functions jo controller se export ho rahe hain, unhe bhi add kar sakte hain)
} = require('../controllers/feeController'); 

// Middleware for Admin access
const adminAuth = [authMiddleware, authorize('Admin'), checkPremiumAccess];

// --- Dashboard & Template Routes ---
// @route   GET /api/fees/dashboard-overview
router.get('/dashboard-overview', adminAuth, getDashboardOverview);

// @route   GET /api/fees/templates
router.get('/templates', adminAuth, getFeeTemplates);

// @route   GET /api/fees/templates/:id
router.get('/templates/:id', adminAuth, getTemplateDetails);

// === FIX 2: Missing 404 Routes ko add karein ===

// @route   POST /api/fees/assign-and-collect (Fixing 404)
// @desc    Ek naya fee assign bhi karein aur collect bhi karein
// @access  Private (Admin)
router.post('/assign-and-collect', adminAuth, assignAndCollectFee);

// @route   GET /api/fees/transactions (Fixing 404)
// @desc    Saare transactions ki list fetch karein
// @access  Private (Admin)
router.get('/transactions', adminAuth, getTransactions);

// @route   GET /api/fees/late-payments (Yeh bhi missing tha)
// @desc    Late payment records fetch karein
// @access  Private (Admin)
router.get('/late-payments', adminAuth, getLatePayments);

// @route   POST /api/fees/calculate-fine (Yeh bhi missing tha)
// @desc    Late fine calculate karein
// @access  Private (Admin)
router.post('/calculate-fine', adminAuth, calculateLateFees);

// --- END FIX ---

// --- Existing Routes ---

// @route   GET /api/fees/ (Default student fee records)
router.get('/', adminAuth, getStudentFeeRecords);

// @route   POST /api/fees/ (Collect fee or record transaction)
router.post('/', adminAuth, collectManualFee);

module.exports = router;
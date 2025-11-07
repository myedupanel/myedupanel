// File: backend/routes/fees.js (Saare 404 Errors ke liye FIX)

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const checkPremiumAccess = require('../middleware/checkPremiumAccess');

// === FIX 1: Saare zaroori functions import karein ===
const { 
    getDashboardOverview,
    getFeeTemplates,
    getTemplateDetails,
    getLatePayments,
    calculateLateFees,
    collectManualFee,
    getStudentFeeRecords,  // <-- Iska URL fix hoga
    assignAndCollectFee,
    getTransactions,
    getProcessingPayments, // <-- YEH MISSING THA
    getEditedRecords,      // <-- YEH MISSING THA
    getPdcRecords,         // <-- YEH MISSING THA
    getTransactionById,    // <-- YEH MISSING THA (Receipt ke liye)
    // (Baaki functions...)
} = require('../controllers/feeController'); 

// Middleware
const adminAuth = [authMiddleware, authorize('Admin')];

// --- Dashboard & Template Routes ---
router.get('/dashboard-overview', adminAuth, getDashboardOverview);
router.get('/templates', adminAuth, getFeeTemplates);
router.get('/templates/:id', adminAuth, getTemplateDetails);

// --- Pichle Fixes (Correct Routes) ---
router.post('/assign-and-collect', adminAuth, assignAndCollectFee);
router.get('/transactions', adminAuth, getTransactions);
router.get('/late-payments', adminAuth, getLatePayments);
router.post('/calculate-fine', adminAuth, calculateLateFees);

// === FIX 2: Naye 404 Errors ke Routes ===

// @route   GET /api/fees/student-records (Fixing 404)
// @desc    Fee Records page ke liye saare records
// (Yeh pehle '/' par tha, ab sahi URL par hai)
router.get('/student-records', adminAuth, getStudentFeeRecords);

// @route   GET /api/fees/transaction/:id (Fixing 404)
// @desc    Receipt details ke liye single transaction
router.get('/transaction/:id', adminAuth, getTransactionById);

// @route   GET /api/fees/processing-payments (Fixing 404)
// @desc    Dashboard tab ke liye
router.get('/processing-payments', adminAuth, getProcessingPayments);

// @route   GET /api/fees/edited-records (Fixing 404)
// @desc    Dashboard tab ke liye
router.get('/edited-records', adminAuth, getEditedRecords);

// @route   GET /api/fees/pdc-records (Fixing 404)
// @desc    Dashboard tab ke liye
router.get('/pdc-records', adminAuth, getPdcRecords);

// --- END FIX ---

// --- Existing Route ---
// @route   POST /api/fees/ (Manual fee collect)
router.post('/', adminAuth, collectManualFee);

module.exports = router;
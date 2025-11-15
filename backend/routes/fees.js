// File: backend/routes/fees.js (Saare 404 Errors ke liye FIX)

const express = require('express');
const router = express.Router();

// Log router creation
console.log('Creating fees router');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const checkPremiumAccess = require('../middleware/checkPremiumAccess');
// Academic year middleware import
const { validateAcademicYear } = require('../middleware/academicYearMiddleware');

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
    getTransactionById,  
    getFeeRecordById,  // <-- NEW: Get fee record details
    createFeeTemplate,
    updateFeeTemplate, 
    deleteFeeTemplate, // <-- YEH MISSING THA (Receipt ke liye)
    exportDetailReport, // <-- Export function
    exportFeeData // <-- NEW: Export function for GET request with query params
} = require('../controllers/feeController'); 

// Middleware
const adminAuth = [authMiddleware, authorize('Admin')];
// Academic year middleware with admin auth
const adminAuthWithAcademicYear = [authMiddleware, authorize('Admin'), validateAcademicYear];
// For fee collection routes, we don't require academic year validation
const adminAuthWithoutAcademicYear = [authMiddleware, authorize('Admin')];

// --- Dashboard & Template Routes ---
router.get('/dashboard-overview', adminAuthWithAcademicYear, getDashboardOverview);
router.get('/templates', adminAuthWithAcademicYear, getFeeTemplates);
router.post('/templates', adminAuthWithAcademicYear, createFeeTemplate);
router.get('/templates/:id', adminAuthWithAcademicYear, getTemplateDetails);
router.put('/templates/:id', adminAuthWithAcademicYear, updateFeeTemplate);
router.delete('/templates/:id', adminAuthWithAcademicYear, deleteFeeTemplate);
// --- Pichle Fixes (Correct Routes) ---
router.post('/assign-and-collect', adminAuthWithoutAcademicYear, assignAndCollectFee);
router.get('/transactions', adminAuthWithAcademicYear, getTransactions);
router.get('/late-payments', adminAuthWithAcademicYear, getLatePayments);
router.post('/calculate-fine', adminAuthWithAcademicYear, calculateLateFees);

// === FIX 2: Naye 404 Errors ke Routes ===

// @route   GET /api/fees/student-records (Fixing 404)
// @desc    Fee Records page ke liye saare records
// (Yeh pehle '/' par tha, ab sahi URL par hai)
router.get('/student-records', adminAuthWithAcademicYear, getStudentFeeRecords);

// @route   GET /api/fees/transaction/:id (Fixing 404)
// @desc    Receipt details ke liye single transaction
router.get('/transaction/:id', adminAuthWithAcademicYear, getTransactionById);

// @route   GET /api/fees/record/:id (NEW)
// @desc    Fee record details for receipts
router.get('/record/:id', adminAuthWithAcademicYear, getFeeRecordById);

// @route   GET /api/fees/processing-payments (Fixing 404)
// @desc    Dashboard tab ke liye
router.get('/processing-payments', adminAuthWithAcademicYear, getProcessingPayments);

// @route   GET /api/fees/edited-records (Fixing 404)
// @desc    Dashboard tab ke liye
router.get('/edited-records', adminAuthWithAcademicYear, getEditedRecords);

// @route   GET /api/fees/pdc-records (Fixing 404)
// @desc    Dashboard tab ke liye
router.get('/pdc-records', adminAuthWithAcademicYear, getPdcRecords);

// @route   GET /api/fees/export-data (Fixing 404)
// @desc    Export fee data with filters as query parameters
router.get('/export-data', adminAuthWithAcademicYear, exportFeeData);

// @route   POST /api/fees/export/detail (Existing export route)
// @desc    Export fee data with filters in request body
router.post('/export/detail', adminAuthWithAcademicYear, exportDetailReport);

// @route   POST /api/fees/collect-manual (Fixing 404)
// @desc    Manual fee collection
console.log('Registering POST /collect-manual route');
router.post('/collect-manual', adminAuthWithoutAcademicYear, collectManualFee);

// --- Existing Route ---
// @route   POST /api/fees/ (Manual fee collect - kept for backward compatibility)
router.post('/', adminAuthWithoutAcademicYear, collectManualFee);

module.exports = router;
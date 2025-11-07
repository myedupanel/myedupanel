// File: backend/routes/fees.js (FIXED - Missing Dashboard Routes Added)

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const checkPremiumAccess = require('../middleware/checkPremiumAccess');

const { 
    getDashboardOverview,      // <-- NEW: Import the dashboard overview function
    getFeeTemplates,           // <-- NEW: Import the templates function
    getTemplateDetails,        // <-- Template details ke liye
    getLatePayments,
    calculateLateFees,
    collectManualFee,
    getStudentFeeRecords,
    // ... (Add other necessary imports from feeController.js) ...
} = require('../controllers/feeController'); 

// Middleware for Admin access
const adminAuth = [authMiddleware, authorize('Admin'), checkPremiumAccess];

// --- MISSING ROUTES ADDED (Fixing the 404 Errors) ---

// @route   GET /api/fees/dashboard-overview
// @desc    Fee dashboard ke statistics fetch karein
// @access  Private (Admin)
router.get('/dashboard-overview', adminAuth, getDashboardOverview);

// @route   GET /api/fees/templates
// @desc    Fee templates ki list fetch karein
// @access  Private (Admin)
router.get('/templates', adminAuth, getFeeTemplates);

// @route   GET /api/fees/templates/:id
// @desc    Single template ki details fetch karein
// @access  Private (Admin)
router.get('/templates/:id', adminAuth, getTemplateDetails);

// --- EXISTING ROUTES (Re-verify) ---

// @route   GET /api/fees/ (Default student fee records)
router.get('/', adminAuth, getStudentFeeRecords);

// @route   POST /api/fees/ (Collect fee or record transaction)
router.post('/', adminAuth, collectManualFee);

// ... (Baaki ke fees routes jaise /late, /calculate-fine, aadi yahaan add kiye ja sakte hain) ...

module.exports = router;
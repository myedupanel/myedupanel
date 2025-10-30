// backend/routes/fees.js
const express = require('express');
const router = express.Router();
// --- REMOVED Mongoose model imports ---
// const Parent = require('../models/Parent');
// const Student = require('../models/Student');
// const User = require('../models/User');
// const generatePassword = require('generate-password'); // Not used here
// const sendEmail = require('../utils/sendEmail'); // Not used here
// --- End Removed Imports ---

const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware'); // Middleware sahi hai
const multer = require('multer'); // File upload ke liye
const upload = multer({ storage: multer.memoryStorage() });

// Sabhi functions feeController se import karein (Yeh sahi hai)
const {
  getDashboardOverview,
  getFeeTemplates,
  getTemplateDetails,
  getLatePayments,
  calculateLateFees,
  sendLateFeeReminders,
  getStudentFeeRecords,
  getProcessingPayments,
  getEditedRecords,
  getPdcRecords,
  assignAndCollectFee,
  createFeeTemplate,
  updateFeeTemplate, // Added based on your previous controller code
  deleteFeeTemplate, // Added based on your previous controller code
  getSampleSheet,
  updateExistingRecords,
  exportDetailReport,
  getPaidTransactions,
  getFailedTransactions,
  getPaymentHistory,
  collectManualFee,
  getTransactionById,
  getClasswiseReport,
  getStudentReportByClass,
  createPaymentOrder,
  verifyPaymentWebhook,
  getTransactions,
} = require('../controllers/feeController'); // Controller import sahi hai

// --- Fee Counter Routes ---
// Saare route definitions bilkul sahi hain, koi change ki zaroorat nahi

// Dashboard
router.get('/dashboard-overview', authMiddleware, getDashboardOverview);

// Templates
router.get('/templates', authMiddleware, getFeeTemplates);
router.get('/templates/:id', authMiddleware, getTemplateDetails);
router.post('/templates', [authMiddleware, adminMiddleware], createFeeTemplate); // Admin middleware add kiya create ke liye
router.put('/templates/:id', [authMiddleware, adminMiddleware], updateFeeTemplate); // Admin middleware add kiya update ke liye
router.delete('/templates/:id', [authMiddleware, adminMiddleware], deleteFeeTemplate); // Admin middleware add kiya delete ke liye

// Assign Fee & Quick Collect Route
router.post('/assign-and-collect', [authMiddleware, adminMiddleware], assignAndCollectFee);

// Fee Collection (Manual)
router.post('/collect-manual', [authMiddleware, adminMiddleware], collectManualFee); // Admin middleware add kiya collect ke liye

// Student Specific Records (Auth middleware کافی hai)
router.get('/student/:studentId/paid', authMiddleware, getPaidTransactions);
router.get('/student/:studentId/failed', authMiddleware, getFailedTransactions);
router.get('/student/:studentId/history', authMiddleware, getPaymentHistory);

// Late Fees (Auth middleware کافی hai)
router.get('/late-payments', authMiddleware, getLatePayments);
router.post('/calculate-late-fees', [authMiddleware, adminMiddleware], calculateLateFees); // Admin action
router.post('/send-reminders', [authMiddleware, adminMiddleware], sendLateFeeReminders); // Admin action

// General Records & Lists (Auth middleware کافی hai)
router.get('/student-records', authMiddleware, getStudentFeeRecords);
router.get('/processing-payments', authMiddleware, getProcessingPayments);
router.get('/edited-records', authMiddleware, getEditedRecords);
router.get('/pdc-records', authMiddleware, getPdcRecords);

// Import / Export (Admin actions)
router.get('/import/sample-sheet', [authMiddleware, adminMiddleware], getSampleSheet);
router.post('/import/update-records', [authMiddleware, adminMiddleware, upload.single('feeRecordFile')], updateExistingRecords);
router.post('/export/detail', [authMiddleware, adminMiddleware], exportDetailReport);

// Reports (Auth middleware کافی hai)
router.get('/reports/classwise', authMiddleware, getClasswiseReport);
router.get('/reports/studentwise/:classId', authMiddleware, getStudentReportByClass);

// Receipt / Single Transaction Detail (Auth middleware کافی hai)
router.get('/transaction/:id', authMiddleware, getTransactionById);

// Transaction History / Search (Auth middleware کافی hai)
router.get('/transactions', authMiddleware, getTransactions);

// Automatic Payment (Razorpay)
router.post('/payment/create-order', authMiddleware, createPaymentOrder); // Student/Parent bhi order create kar sakta hai
router.post('/payment/verify-webhook', verifyPaymentWebhook); // Ismein middleware nahi hota


module.exports = router;
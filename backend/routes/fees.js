const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware'); // Assuming authMiddleware is needed
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Import all functions from feeController
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
  assignFeeToStudent,
  createFeeTemplate,
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
  verifyPaymentWebhook
} = require('../controllers/feeController');

// --- Fee Counter Routes ---

// Dashboard
router.get('/dashboard-overview', authMiddleware, getDashboardOverview);

// Templates
router.get('/templates', authMiddleware, getFeeTemplates);
router.get('/templates/:id', authMiddleware, getTemplateDetails);
router.post('/templates', authMiddleware, createFeeTemplate);

// Assign Fee
router.post('/assign', authMiddleware, assignFeeToStudent);

// Fee Collection (Manual)
router.post('/collect-manual', authMiddleware, collectManualFee);

// Student Specific Records (For Fee Collection page tabs)
router.get('/student/:studentId/paid', authMiddleware, getPaidTransactions);
router.get('/student/:studentId/failed', authMiddleware, getFailedTransactions);
router.get('/student/:studentId/history', authMiddleware, getPaymentHistory);

// Late Fees
router.get('/late-payments', authMiddleware, getLatePayments);
router.post('/calculate-late-fees', authMiddleware, calculateLateFees);
router.post('/send-reminders', authMiddleware, sendLateFeeReminders);

// General Records & Lists
router.get('/student-records', authMiddleware, getStudentFeeRecords);
router.get('/processing-payments', authMiddleware, getProcessingPayments);
router.get('/edited-records', authMiddleware, getEditedRecords);
router.get('/pdc-records', authMiddleware, getPdcRecords);

// Import / Export
router.get('/import/sample-sheet', authMiddleware, getSampleSheet);
router.post(
    '/import/update-records',
    authMiddleware,
    upload.single('feeRecordFile'), // Match frontend input name
    updateExistingRecords
);
router.post('/export/detail', authMiddleware, exportDetailReport);

// Reports
router.get('/reports/classwise', authMiddleware, getClasswiseReport);
router.get('/reports/studentwise/:classId', authMiddleware, getStudentReportByClass);

// Receipt
router.get('/transaction/:id', authMiddleware, getTransactionById);

// Automatic Payment (Razorpay)
router.post('/payment/create-order', authMiddleware, createPaymentOrder);
// Webhook endpoint - No authMiddleware needed as it's called by Razorpay
router.post('/payment/verify-webhook', verifyPaymentWebhook);

module.exports = router;
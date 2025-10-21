const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const feeController = require('../controllers/feeController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

//  GET /api/fees/dashboard-overview
router.get('/dashboard-overview', authMiddleware, feeController.getDashboardOverview);

//  GET /api/fees/templates
router.get('/templates', authMiddleware, feeController.getFeeTemplates);

//  GET /api/fees/templates/:id
router.get('/templates/:id', authMiddleware, feeController.getTemplateDetails);

//  GET /api/fees/late-payments
router.get('/late-payments', authMiddleware, feeController.getLatePayments);

//  POST /api/fees/calculate-late-fees
router.post('/calculate-late-fees', authMiddleware, feeController.calculateLateFees);

//  POST /api/fees/send-reminders
router.post('/send-reminders', authMiddleware, feeController.sendLateFeeReminders);

//  GET /api/fees/student-records
router.get('/student-records', authMiddleware, feeController.getStudentFeeRecords);

router.get(
    '/processing-payments',
    authMiddleware,
    feeController.getProcessingPayments
);

router.get(
    '/edited-records',
    authMiddleware,
    feeController.getEditedRecords
);

router.get(
    '/pdc-records',
    authMiddleware,
    feeController.getPdcRecords
);

router.post(
    '/assign',
    authMiddleware,
    feeController.assignFeeToStudent
);

router.post(
    '/templates',
    authMiddleware,
    feeController.createFeeTemplate
);

router.get(
    '/import/sample-sheet',
    authMiddleware,
    feeController.getSampleSheet
);

router.post(
    '/import/update-records',
    authMiddleware,
    upload.single('feeRecordFile'), // 'feeRecordFile' file input ka naam hoga
    feeController.updateExistingRecords
);
router.post('/export/detail', authMiddleware, feeController.exportDetailReport);

router.get(
    '/student/:studentId/paid',
    authMiddleware,
    feeController.getPaidTransactions
);
router.get(
    '/student/:studentId/failed',
    authMiddleware,
    feeController.getFailedTransactions
);
router.get(
    '/student/:studentId/history',
    authMiddleware,
    feeController.getPaymentHistory
);
module.exports = router;
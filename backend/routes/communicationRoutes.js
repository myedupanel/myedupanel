const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkPremiumAccess } = require('../middleware/checkPremiumAccess');
const { 
    sendFeeReminder, 
    sendBulkFeeReminders, 
    configureAttendanceAlerts,
    getRecentNotifications,
    sendMessage,
    getConversations,
    getMessages
} = require('../controllers/communicationController');

// All communication routes require authentication only
router.use(authenticateToken);

// Fee Reminders
router.post('/fee-reminders/send', sendFeeReminder);
router.post('/fee-reminders/send-bulk', sendBulkFeeReminders);

// Attendance Alerts
router.put('/attendance-alerts', configureAttendanceAlerts);
router.get('/recent-notifications', getRecentNotifications);

// Teacher-Parent Chat
router.post('/messages', sendMessage);
router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);

module.exports = router;
// backend/routes/classes.js
const express = require('express');
const router = express.Router();

// ✅ FIX: Import adminMiddleware for authorization
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware'); 
const classController = require('../controllers/classController');

// Existing GET route (no change)
router.get('/', authMiddleware, classController.getClasses);

// ✅ FIX: Add the POST route for creating a new class
// This tells Express: "When a POST request comes to /api/classes, 
// first check authentication (authMiddleware), then check if the user is an admin (adminMiddleware), 
// and if both pass, run the classController.addClass function."
router.post('/', [authMiddleware, adminMiddleware], classController.addClass); 

module.exports = router;
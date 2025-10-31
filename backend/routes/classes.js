// backend/routes/classes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware'); // authMiddleware import karein
const classController = require('../controllers/classController'); // Controller import karein

// --- YEH HAIN AAPKE ROUTES (FIXED) ---

// GET /api/classes
// Saari classes ki list fetch karega
router.get(
    '/', 
    [authMiddleware, authorize('Admin')], // <-- FIX: 'admin' ko 'Admin' (Capital A) kiya
    classController.getClasses
);

// POST /api/classes
// Nayi class add karega
router.post(
    '/', 
    [authMiddleware, authorize('Admin')], // <-- FIX: 'admin' ko 'Admin' (Capital A) kiya
    classController.addClass
);

// PUT /api/classes/:id
// Ek class ko update (edit) karega
router.put(
    '/:id', 
    [authMiddleware, authorize('Admin')], // <-- FIX: 'admin' ko 'Admin' (Capital A) kiya
    classController.updateClass
);

// DELETE /api/classes/:id
// Ek class ko delete karega
router.delete(
    '/:id', 
    [authMiddleware, authorize('Admin')], // <-- FIX: 'admin' ko 'Admin' (Capital A) kiya
    classController.deleteClass
);

module.exports = router;
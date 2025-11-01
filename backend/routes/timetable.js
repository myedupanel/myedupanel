// backend/routes/timetable.js
const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Timetable Controller functions को import करें
const {
    getSettings,
    getAssignments,
    assignPeriod,
    // --- NAYE FUNCTIONS ADD KIYE GAYE HAIN ---
    createOrUpdateSlot, // Time Slot Create/Update के लिए
    deleteSlot,         // Time Slot Delete के लिए
    updateWorkingDays,  // Working Days Update के लिए
    // --- END NAYE FUNCTIONS ---
} = require('../controllers/timetableController'); 

// --- 1. GET /api/timetable/settings (Days, Slots, Classes, Teachers) ---
router.get('/settings', authMiddleware, getSettings);

// ----------------------------------------------------
// --- 2. TIME SLOT MANAGEMENT (Settings Page) ---
// ----------------------------------------------------

// POST /api/timetable/settings/slot (Create New Slot)
router.post('/settings/slot', [authMiddleware, authorize('Admin')], createOrUpdateSlot);

// PUT /api/timetable/settings/slot/:id (Update Existing Slot)
router.put('/settings/slot/:id', [authMiddleware, authorize('Admin')], createOrUpdateSlot);

// DELETE /api/timetable/settings/slot/:id (Delete Slot)
router.delete('/settings/slot/:id', [authMiddleware, authorize('Admin')], deleteSlot);

// --- 3. WORKING DAYS MANAGEMENT ---
// POST /api/timetable/settings/days (Update the entire list of working days)
router.post('/settings/days', [authMiddleware, authorize('Admin')], updateWorkingDays);

// ----------------------------------------------------
// --- 4. ASSIGNMENTS (Timetable Grid) ---
// ----------------------------------------------------

router.get('/assignments', authMiddleware, getAssignments);
router.post('/assign', [authMiddleware, authorize('Admin')], assignPeriod);

module.exports = router;
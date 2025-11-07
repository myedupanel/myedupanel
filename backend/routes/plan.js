// File: backend/routes/planRoutes.js (Nayi file)

const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Controller functions ko import karein
const {
  getPublicPlans,
  getAllPlansAdmin,
  createPlanAdmin,
  updatePlanAdmin,
  deletePlanAdmin
} = require('../controllers/planController');

// --- Public Route (Jo pehle se tha) ---

// @route   GET /api/plans
// @desc    Public ke liye active plans fetch karna
// @access  Public
router.get('/', getPublicPlans);


// --- SuperAdmin Routes (Naye) ---

// Middleware sirf SuperAdmin ko allow karne ke liye
const superAdminAuth = [authMiddleware, authorize('SuperAdmin')];

// @route   GET /api/plans/admin-all
// @desc    SuperAdmin ke liye saare plans fetch karna (Active aur Inactive)
// @access  Private (SuperAdmin)
router.get('/admin-all', superAdminAuth, getAllPlansAdmin);

// @route   POST /api/plans/admin
// @desc    Naya plan banana
// @access  Private (SuperAdmin)
router.post('/admin', superAdminAuth, createPlanAdmin);

// @route   PUT /api/plans/admin/:id
// @desc    Ek plan ko update karna
// @access  Private (SuperAdmin)
router.put('/admin/:id', superAdminAuth, updatePlanAdmin);

// @route   DELETE /api/plans/admin/:id
// @desc    Ek plan ko delete karna
// @access  Private (SuperAdmin)
router.delete('/admin/:id', superAdminAuth, deletePlanAdmin);

module.exports = router;
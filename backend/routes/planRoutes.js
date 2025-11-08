// File: backend/routes/planRoutes.js (Nayi file)

const express = require('express');
// ... (saare imports)
const {
  getPublicPlans,
  getAllPlansAdmin,
  createPlanAdmin,
  updatePlanAdmin,
  deletePlanAdmin
} = require('../controllers/planController');

// ... (Public route)
router.get('/', getPublicPlans);

// ... (SuperAdmin routes)
const superAdminAuth = [authMiddleware, authorize('SuperAdmin')];
router.get('/admin-all', superAdminAuth, getAllPlansAdmin);
router.post('/admin', superAdminAuth, createPlanAdmin);
router.put('/admin/:id', superAdminAuth, updatePlanAdmin);
router.delete('/admin/:id', superAdminAuth, deletePlanAdmin);

module.exports = router;
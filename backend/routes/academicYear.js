// backend/routes/academicYear.js
const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const {
  getAcademicYears,
  getCurrentYear,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  setCurrentYear,
  deleteAcademicYear,
  cloneYearData,
} = require('../controllers/academicYearController');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/academic-years
 * Get all academic years for the school
 */
router.get('/', getAcademicYears);

/**
 * GET /api/academic-years/current
 * Get the current active year
 */
router.get('/current', getCurrentYear);

/**
 * GET /api/academic-years/:id
 * Get a specific academic year by ID
 */
router.get('/:id', getAcademicYearById);

/**
 * POST /api/academic-years
 * Create a new academic year (Admin only)
 */
router.post('/', authorize('Admin'), createAcademicYear);

/**
 * PUT /api/academic-years/:id
 * Update an academic year (Admin only)
 */
router.put('/:id', authorize('Admin'), updateAcademicYear);

/**
 * POST /api/academic-years/set-current
 * Set a year as current/active (Admin only)
 */
router.post('/set-current', authorize('Admin'), setCurrentYear);

/**
 * DELETE /api/academic-years/:id
 * Delete an academic year (Admin only)
 */
router.delete('/:id', authorize('Admin'), deleteAcademicYear);

/**
 * POST /api/academic-years/clone
 * Clone data from one year to another (Admin only)
 */
router.post('/clone', authorize('Admin'), cloneYearData);

module.exports = router;

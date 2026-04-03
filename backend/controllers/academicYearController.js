// backend/controllers/academicYearController.js
const {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  getCurrentAcademicYear,
  setActiveYear,
  updateAcademicYear,
  deleteAcademicYear,
  cloneYearData,
} = require('../services/AcademicYearService');

/**
 * GET all academic years for a school
 */
exports.getAcademicYears = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID not found.' });
    }

    const years = await getAllAcademicYears(schoolId);
    return res.json(years);
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return res.status(500).json({ error: 'Failed to fetch academic years.' });
  }
};

/**
 * GET current active year
 */
exports.getCurrentYear = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID not found.' });
    }

    const currentYear = await getCurrentAcademicYear(schoolId);
    
    if (!currentYear) {
      return res.status(404).json({ error: 'No current academic year found.' });
    }

    return res.json(currentYear);
  } catch (error) {
    console.error('Error fetching current year:', error);
    return res.status(500).json({ error: 'Failed to fetch current year.' });
  }
};

/**
 * GET a single academic year by ID
 */
exports.getAcademicYearById = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const yearId = parseInt(req.params.id);

    if (isNaN(yearId)) {
      return res.status(400).json({ error: 'Invalid year ID.' });
    }

    const year = await getAcademicYearById(yearId, schoolId);
    
    if (!year) {
      return res.status(404).json({ error: 'Academic year not found.' });
    }

    return res.json(year);
  } catch (error) {
    console.error('Error fetching academic year:', error);
    return res.status(500).json({ error: 'Failed to fetch academic year.' });
  }
};

/**
 * POST create a new academic year
 */
exports.createAcademicYear = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { yearName, startDate, endDate, isCurrent } = req.body;

    // Validation
    if (!yearName || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields: yearName, startDate, endDate.' });
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date.' });
    }

    const newYear = await createAcademicYear({
      yearName,
      startDate,
      endDate,
      schoolId,
      isCurrent: isCurrent || false,
    });

    return res.status(201).json(newYear);
  } catch (error) {
    console.error('Error creating academic year:', error);
    
    // Handle duplicate year name
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An academic year with this name already exists.' });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to create academic year.' });
  }
};

/**
 * PUT update an academic year
 */
exports.updateAcademicYear = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const yearId = parseInt(req.params.id);
    const updateData = req.body;

    if (isNaN(yearId)) {
      return res.status(400).json({ error: 'Invalid year ID.' });
    }

    // Date validation if dates are being updated
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      
      if (start >= end) {
        return res.status(400).json({ error: 'End date must be after start date.' });
      }
    }

    const updatedYear = await updateAcademicYear(yearId, schoolId, updateData);
    return res.json(updatedYear);
  } catch (error) {
    console.error('Error updating academic year:', error);
    return res.status(500).json({ error: error.message || 'Failed to update academic year.' });
  }
};

/**
 * POST set a year as current/active
 */
exports.setCurrentYear = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { yearId } = req.body;

    if (!yearId) {
      return res.status(400).json({ error: 'Year ID is required.' });
    }

    const activatedYear = await setActiveYear(schoolId, parseInt(yearId));
    return res.json({ 
      message: 'Academic year activated successfully.', 
      year: activatedYear 
    });
  } catch (error) {
    console.error('Error setting current year:', error);
    return res.status(500).json({ error: error.message || 'Failed to set current year.' });
  }
};

/**
 * DELETE an academic year
 */
exports.deleteAcademicYear = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const yearId = parseInt(req.params.id);

    if (isNaN(yearId)) {
      return res.status(400).json({ error: 'Invalid year ID.' });
    }

    await deleteAcademicYear(yearId, schoolId);
    return res.json({ message: 'Academic year deleted successfully.' });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return res.status(400).json({ error: error.message || 'Failed to delete academic year.' });
  }
};

/**
 * POST clone data from one year to another
 */
exports.cloneYearData = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { sourceYearId, targetYearId, cloneStudents, cloneTeachers, cloneFeeTemplates } = req.body;

    if (!sourceYearId || !targetYearId) {
      return res.status(400).json({ error: 'Source and target year IDs are required.' });
    }

    const result = await cloneYearData(
      parseInt(sourceYearId),
      parseInt(targetYearId),
      schoolId,
      { cloneStudents, cloneTeachers, cloneFeeTemplates }
    );

    return res.json({ 
      message: 'Data cloned successfully.', 
      result 
    });
  } catch (error) {
    console.error('Error cloning year data:', error);
    return res.status(500).json({ error: error.message || 'Failed to clone data.' });
  }
};
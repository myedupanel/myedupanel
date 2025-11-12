// backend/middleware/academicYearMiddleware.js
const prisma = require('../config/prisma');

/**
 * Middleware to inject current academic year ID into requests
 * This reads from cookies or fetches the current year for the school
 */
const injectAcademicYear = async (req, res, next) => {
  try {
    const schoolId = req.user?.schoolId;
    
    if (!schoolId) {
      return next(); // Skip if no school ID (public routes)
    }

    // Try to get year ID from cookie first
    let academicYearId = req.cookies?.academicYearId;

    // If no cookie, fetch the current active year from database
    if (!academicYearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { schoolId, isCurrent: true },
        select: { id: true }
      });

      if (currentYear) {
        academicYearId = currentYear.id;
        // Set cookie for future requests (expires in 30 days)
        res.cookie('academicYearId', academicYearId, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          sameSite: 'strict',
        });
      }
    }

    // Attach to request object
    req.academicYearId = academicYearId ? parseInt(academicYearId) : null;
    
    next();
  } catch (error) {
    console.error('Error in academicYearMiddleware:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware to verify academic year exists and belongs to school
 */
const validateAcademicYear = async (req, res, next) => {
  try {
    const { academicYearId } = req;
    const schoolId = req.user?.schoolId;

    if (!academicYearId || !schoolId) {
      return res.status(400).json({ 
        error: 'No academic year selected. Please select an academic year.' 
      });
    }

    // Verify the year belongs to this school
    const year = await prisma.academicYear.findFirst({
      where: { id: academicYearId, schoolId },
    });

    if (!year) {
      return res.status(403).json({ 
        error: 'Invalid academic year or access denied.' 
      });
    }

    // Attach full year object to request
    req.academicYear = year;
    next();
  } catch (error) {
    console.error('Error validating academic year:', error);
    return res.status(500).json({ error: 'Failed to validate academic year.' });
  }
};

module.exports = {
  injectAcademicYear,
  validateAcademicYear,
};

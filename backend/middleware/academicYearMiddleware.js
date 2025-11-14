// backend/middleware/academicYearMiddleware.js
const prisma = require('../config/prisma');

/**
 * Middleware to inject current academic year ID into requests
 * This reads from cookies or fetches the current year for the school
 */
const injectAcademicYear = async (req, res, next) => {
  try {
    const schoolId = req.user?.schoolId;
    
    console.log(`[injectAcademicYear] Processing request for schoolId: ${schoolId}`);
    console.log(`[injectAcademicYear] Request URL: ${req.originalUrl}`);
    
    if (!schoolId) {
      console.log("[injectAcademicYear] No schoolId found, setting academicYearId to null");
      req.academicYearId = null;
      return next(); // Skip if no school ID (public routes)
    }

    // Try to get year ID from cookie first
    let academicYearId = req.cookies?.academicYearId;     
    console.log(`[injectAcademicYear] academicYearId from cookie: ${academicYearId}`);

    // If no cookie, fetch the current active year from database
    if (!academicYearId) {
      console.log("[injectAcademicYear] No academicYearId in cookie, fetching from database");
      const currentYear = await prisma.academicYear.findFirst({
        where: { schoolId, isCurrent: true },
        select: { id: true }
      });
      
      console.log(`[injectAcademicYear] Current year from database:`, currentYear);

      if (currentYear) {
        academicYearId = currentYear.id;
        // Set cookie for future requests (expires in 30 days)
        res.cookie('academicYearId', academicYearId, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          sameSite: 'strict',
        });
        console.log(`[injectAcademicYear] Set academicYearId cookie: ${academicYearId}`);
      }
    }

    // Attach to request object
    req.academicYearId = academicYearId ? parseInt(academicYearId) : null;
    console.log(`[injectAcademicYear] Final academicYearId attached to request: ${req.academicYearId}`);
    
    next();
  } catch (error) {
    console.error('Error in academicYearMiddleware:', error);
    console.error('Error stack:', error.stack);
    // Set academicYearId to null in case of error
    req.academicYearId = null;
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware to verify academic year exists and belongs to school
 * Modified to be more permissive for certain routes
 */
const validateAcademicYear = async (req, res, next) => {
  try {
    const { academicYearId } = req;
    const schoolId = req.user?.schoolId;
    
    console.log(`[validateAcademicYear] Validating academicYearId: ${academicYearId} for schoolId: ${schoolId}`);

    // For certain routes that don't require academic year validation, allow to proceed
    // This includes fee collection routes which should work regardless of academic year selection
    const exemptRoutes = [
      '/api/fees/collect-manual',
      '/api/fees/assign-and-collect'
    ];
    
    const currentRoute = req.originalUrl;
    console.log(`[validateAcademicYear] Checking route: ${currentRoute}`);
    
    // More specific check for the exact route we're having trouble with
    const isCollectManualRoute = currentRoute.includes('/api/fees/collect-manual');
    console.log(`[validateAcademicYear] Is collect manual route: ${isCollectManualRoute}`);
    
    const isExempt = exemptRoutes.some(route => currentRoute.includes(route)) || isCollectManualRoute;
    console.log(`[validateAcademicYear] Is exempt: ${isExempt}`);
    
    if (isExempt) {
      console.log(`[validateAcademicYear] Route ${currentRoute} is exempt from academic year validation`);
      return next();
    }

    if (!academicYearId || !schoolId) {
      // Try to get or create a default academic year
      console.log("[validateAcademicYear] No academicYearId or schoolId, trying to get default");
      const academicYearService = require('../services/AcademicYearService');
      const currentYear = await academicYearService.getCurrentAcademicYear(schoolId);
      
      if (currentYear) {
        req.academicYearId = currentYear.id;
        req.academicYear = currentYear;
        console.log(`[validateAcademicYear] Found current year: ${currentYear.id}`);
        return next();
      } else {
        console.log("[validateAcademicYear] No current year found");
        return res.status(400).json({ 
          error: 'No academic year selected. Please select an academic year.' 
        });
      }
    }

    // Verify the year belongs to this school
    const year = await prisma.academicYear.findFirst({
      where: { id: academicYearId, schoolId },
    });
    
    console.log(`[validateAcademicYear] Year verification result:`, year);

    if (!year) {
      console.log("[validateAcademicYear] Year not found or access denied");
      return res.status(403).json({ 
        error: 'Invalid academic year or access denied.' 
      });
    }

    // Attach full year object to request
    req.academicYear = year;
    console.log("[validateAcademicYear] Year validated successfully");
    next();
  } catch (error) {
    console.error('Error validating academic year:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: 'Failed to validate academic year.' });
  }
};

module.exports = {
  injectAcademicYear,
  validateAcademicYear,
};
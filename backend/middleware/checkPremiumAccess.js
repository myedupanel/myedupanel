// File: backend/middleware/checkPremiumAccess.js

const prisma = require('../config/prisma');

const checkPremiumAccess = async (req, res, next) => {
  try {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ message: 'Authentication error. User details not found.' });
    }

    // === Check 1: SuperAdmin Bypass ===
    // SuperAdmin ko hamesha access milega
    if (req.user.role === 'SuperAdmin') {
      return next(); 
    }

    // === Check 2: Database se School Ka Plan Check Karo ===
    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId },
      select: { plan: true, planExpiryDate: true }
    });

    if (!school) {
      return res.status(404).json({ message: 'School profile not found.' });
    }

    const today = new Date();

    // === Check 3: Sirf Premium Plans ko Allow Karo ===
    // (Aapke schema ke hisaab se abhi 'PRO' plan hai)
    if (school.plan === 'PRO' || school.plan === 'PLUS') { // Future ke liye PLUS bhi add kar diya
      
      // Check karo ki plan expire toh nahi ho gaya
      if (school.planExpiryDate && school.planExpiryDate < today) {
        return res.status(403).json({ 
          message: `Your ${school.plan} plan has expired. Please renew.`,
          errorCode: 'PLAN_EXPIRED'
        });
      }
      // Plan active hai
      return next(); // Allow access

    } else {
      // Agar plan 'TRIAL' ya 'STARTER' ya 'NONE' hai
      return res.status(403).json({ 
        message: 'This is a premium feature. Please upgrade to the PRO plan to access this.',
        errorCode: 'UPGRADE_REQUIRED' 
      });
    }

  } catch (error) {
    console.error("Error in checkPremiumAccess middleware:", error);
    res.status(500).json({ message: 'Server Error while verifying subscription.' });
  }
};

module.exports = checkPremiumAccess;
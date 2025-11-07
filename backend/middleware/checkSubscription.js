// File: backend/middleware/checkSubscription.js

const prisma = require('../config/prisma');

const checkSubscription = async (req, res, next) => {
  try {
    // Sabse pehle, check karo ki 'authMiddleware' ne user ko request mein add kiya hai ya nahi
    if (!req.user || !req.user.schoolId) {
      // Yeh error tab aayega agar 'authMiddleware' isse pehle run nahi hua
      return res.status(401).json({ message: 'Authentication error. User details not found.' });
    }

    // === Check 1: SuperAdmin Bypass ===
    // Jaisa humne plan kiya tha, 'SuperAdmin' ko saare rules se direct entry milegi
    if (req.user.role === 'SuperAdmin') {
      return next(); // Rule check skip karo, direct entry do
    }

    // === Check 2: Database se School Ka Plan Check Karo ===
    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId },
      select: {
        plan: true,
        planExpiryDate: true
      }
    });

    // Agar kisi vajah se school nahi milta
    if (!school) {
      return res.status(404).json({ message: 'School profile not found for this user.' });
    }

    // === Check 3: Plan Status aur Expiry Check ===
    const today = new Date();

    if (school.plan === 'STARTER' || school.plan === 'TRIAL') {
      // Agar plan 'STARTER' ya 'TRIAL' hai, toh expiry date check karo
      if (school.planExpiryDate && school.planExpiryDate < today) {
        // Plan Expire ho chuka hai
        return res.status(403).json({ 
          message: `Your ${school.plan} plan has expired. Please upgrade or contact support.`,
          errorCode: 'PLAN_EXPIRED' // Frontend is error ko pehchaan sakta hai
        });
      }
      
      // Agar plan active hai aur expire nahi hua hai
      return next(); // Allow access

    } else {
      // Agar plan 'NONE' hai ya set nahi hai
      return res.status(403).json({ 
        message: 'You do not have an active subscription. Please subscribe to access this feature.',
        errorCode: 'NO_PLAN' // Frontend is error ko pehchaan sakta hai
      });
    }

  } catch (error) {
    console.error("Error in checkSubscription middleware:", error);
    res.status(500).json({ message: 'Server Error while verifying subscription.' });
  }
};

module.exports = checkSubscription;
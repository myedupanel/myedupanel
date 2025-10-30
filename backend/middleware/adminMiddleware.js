// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma'); // PRISMA client

// Yeh middleware token verify karta hai aur user ko 'req.user' mein daalta hai
const authMiddleware = async (req, res, next) => { 
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userId = decoded.id; 
    
    if (!userId) {
        throw new Error('Token does not contain user ID'); 
    }

    // Prisma se user ko fetch karein (password ke bina)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { // Sirf zaroori data select karein
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        status: true,
      }
    });

    if (!user) {
        return res.status(401).json({ msg: 'User belonging to this token does not exist.' });
    }
    
    req.user = user; // Database se mila user object attach karein
    next();

  } catch (err) {
    console.error("Auth Middleware Error:", err.message); 
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Yeh function role check karne ke liye hai
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check karta hai ki req.user.role (jo 'Admin' hai)
    // woh allowed roles ki list ['Admin'] mein hai ya nahi
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: `Access denied. Role '${req.user?.role}' is not authorized.` });
    }
    next();
  };
};

// --- YEH HAI AAPKA NAYA ADMIN MIDDLEWARE ---
// Hum 'Admin' (capital 'A') check kar rahe hain
const adminMiddleware = authorize('Admin'); 

module.exports = {
  authMiddleware,
  authorize,
  adminMiddleware // Hum ise yahaan se export kar rahe hain
};
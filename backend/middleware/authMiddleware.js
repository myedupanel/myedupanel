const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma'); // Naya import: Prisma client

// NAYA Updated authMiddleware
const authMiddleware = async (req, res, next) => { // Function ko 'async' banaya
  // --- Get token from header (Same) ---
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // --- Verify token (Same) ---
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // --- NAYA: Fetch user from database using Prisma ---
    // Token se user ki ID (number) nikaalein
    const userId = decoded.id; 
    
    if (!userId) {
        throw new Error('Token does not contain user ID'); // Error agar ID na mile
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
        // Password ko yahaan include NAHI karna hai
      }
    });

    // Agar user database mein na mile (shayad delete ho gaya ho)
    if (!user) {
        return res.status(401).json({ msg: 'User belonging to this token does not exist.' });
    }
    
    // --- Attach fetched user object to request ---
    req.user = user; // Database se mila user object attach karein

    // Proceed to next step
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message); // Behtar error logging
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// --- authorize function (UPDATED WITH BYPASS) ---
const authorize = (...roles) => {
  return (req, res, next) => {
    
    // Pehle check karo user hai ya nahi
    if (!req.user) {
      return res.status(401).json({ msg: 'No user found, authorization denied.' });
    }

    // === YAHI HAI SUPER ADMIN BYPASS ===
    // Agar user ka role 'SuperAdmin' hai, toh baaki rules check hi mat karo
    // aur unhein direct entry de do.
    if (req.user.role === 'SuperAdmin') {
      return next(); // <-- Rule check skip kiya, direct entry
    }
    // === BYPASS ENDS HERE ===

    // Normal users ke liye (Admin, Teacher, etc.)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: `Access denied. Role '${req.user.role}' is not authorized.` });
    }
    
    next();
  };
};

// --- adminMiddleware (No changes) ---
const adminMiddleware = authorize('Admin'); // Role ka naam check karein ('Admin' ya 'admin')

// --- Exports (Same) ---
module.exports = {
  authMiddleware,
  authorize,
  adminMiddleware
};
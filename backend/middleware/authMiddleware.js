// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// Yeh function check karta hai ki user logged-in hai ya nahi (No changes here)
const authMiddleware = function(req, res, next) {
  // --- Get token from header ---
  const authHeader = req.header('Authorization'); // Get the whole header
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null; // Extract token after 'Bearer '

  if (!token) {
    // console.log("Middleware: No token found."); // Debugging log
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user payload ({ id, role, name, schoolId, schoolName }) to request
    // console.log("Middleware: Token verified, user:", req.user); // Debugging log
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    // console.log("Middleware: Invalid token error:", err.message); // Debugging log
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Yeh function check karta hai ki user ka role sahi hai ya nahi (No changes here)
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user object exists and if their role is included in the allowed roles
    if (!req.user || !roles.includes(req.user.role)) {
      // console.log(`Middleware: Authorization failed. User role: ${req.user?.role}, Allowed roles: ${roles}`); // Debugging log
      return res.status(403).json({ msg: `Access denied. Role '${req.user?.role}' is not authorized.` });
    }
    // console.log(`Middleware: Authorization successful for role: ${req.user.role}`); // Debugging log
    next(); // User has the required role, proceed
  };
};

// --- NEW: Define adminMiddleware using authorize ---
const adminMiddleware = authorize('admin');
// --- End NEW ---

// --- UPDATED: Export all three functions ---
module.exports = {
  authMiddleware,
  authorize,
  adminMiddleware // Export the new middleware
};
// --- End UPDATED ---
// File: backend/middleware/parentMiddleware.js
// Parent-specific authentication and authorization middleware

const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Parent authentication middleware
const parentAuth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided. Authorization denied.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify this is a parent role
    if (decoded.role !== 'Parent') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Parent role required.' 
      });
    }

    // Fetch complete parent user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        parent: {
          include: {
            student: true
          }
        },
        school: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found.' 
      });
    }

    if (!user.parent) {
      return res.status(403).json({ 
        success: false,
        message: 'Parent profile not configured properly.' 
      });
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      schoolName: user.school?.name,
      parentId: user.parent.id,
      studentId: user.parent.studentId
    };

    next();
  } catch (err) {
    console.error("Parent Auth Middleware Error:", err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token.' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error during authentication.' 
    });
  }
};

// Parent data isolation middleware
// Ensures parents can only access their own child's data
const parentDataIsolation = async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const studentId = req.user.studentId;
    
    // Add filters to request for data isolation
    req.parentFilters = {
      parentId: parentId,
      studentId: studentId,
      schoolId: req.user.schoolId
    };

    next();
  } catch (error) {
    console.error('Parent Data Isolation Error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Error setting up data isolation.' 
    });
  }
};

// Parent-specific authorization middleware
const authorizeParent = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions.' 
      });
    }

    next();
  };
};

module.exports = {
  parentAuth,
  parentDataIsolation,
  authorizeParent
};
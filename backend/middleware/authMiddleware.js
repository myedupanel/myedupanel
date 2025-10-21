// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// Yeh function check karta hai ki user logged-in hai ya nahi
const authMiddleware = function(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Yeh function check karta hai ki user ka role sahi hai ya nahi
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: `Access denied. You do not have the required role.` });
    }
    next();
  };
};

// Dono functions ko export karein
module.exports = {
  authMiddleware,
  authorize
};
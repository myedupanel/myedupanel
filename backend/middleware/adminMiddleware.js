const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    // authMiddleware ne pehle hi req.user.id set kar diya hai
    const user = await User.findById(req.user.id);

    if (user && user.role === 'admin') {
      next(); // User admin hai, aage badhne do
    } else {
      res.status(403).json({ msg: 'Access denied. Admin role required.' });
    }
  } catch (error) {
    res.status(500).send('Server Error in admin middleware');
  }
};

module.exports = { adminMiddleware };
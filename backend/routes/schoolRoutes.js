const express = require('express');
const router = express.Router();

// Apna auth middleware yahaan import karein
// ✨ FIX: authMiddleware function ko object se extract (destructure) karein
const { authMiddleware } = require('../middleware/authMiddleware'); 

// Apne database models ko import karein
const School = require('../models/School');
const User = require('../models/User'); // Ya 'Admin', jo bhi aapka user model ho

/*
 * @route   GET /api/school/profile
 * @desc    Get logged-in user's school profile
 * @access  Private (Sirf logged-in admin hi access kar sakta hai)
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    /* * 'authMiddleware' aapke token ko decode karke 'req.user.id' mein 
     * logged-in user ki ID daal dega.
     */
    
    // 1. Logged-in user ko dhoondhein
    //    Hum 'select' ka use karke sirf 'school' field la rahe hain
    const user = await User.findById(req.user.id).select('school');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // 2. User se judi school ID se school ki details dhoondhein
    //    (Maan rahe hain ki user ke andar school ki ID 'user.school' naam se save hai)
    const school = await School.findById(user.school);

    if (!school) {
      return res.status(404).json({ msg: 'School profile not found for this user' });
    }

    // 3. School ki details JSON format mein bhej dein
    res.json(school);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
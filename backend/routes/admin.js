const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// @route   POST /api/admin/create-user
// @desc    Admin creates a new user (teacher, student, parent)
// @access  Private (Admin only)
router.post(
  '/create-user',
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const { name, email, role, studentClass, parentOf } = req.body;

      if (!name || !email || !role) {
        return res.status(400).json({ msg: 'Please provide name, email, and role.' });
      }
      if (role === 'student' && !studentClass) {
        return res.status(400).json({ msg: 'Please provide class for the student.' });
      }

      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User with this email already exists.' });
      }

      const temporaryPassword = crypto.randomBytes(8).toString('hex');

      const newUserDetails = {
        adminName: name, // Assuming User model uses adminName field
        schoolName: req.user.schoolName, // Assign admin's school
        email,
        role,
        password: temporaryPassword,
        ...(role === 'student' && { 'details.class': studentClass }),
        ...(role === 'parent' && { 'details.children': [parentOf] })
      };

      user = new User(newUserDetails);
      await user.save();

      try {
        const subject = 'Your SchoolPro Account has been created!';
        const message = `
          <h1>Welcome to SchoolPro, ${name}!</h1>
          <p>An admin has created an account for you.</p>
          <p>You can now log in using the following credentials:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          <br>
          <p>Please log in and change your password as soon as possible.</p>
        `;
        await sendEmail({ to: user.email, subject, html: message });
      } catch (emailError) {
        console.error("Could not send creation email:", emailError);
        return res.status(201).json({
            msg: 'User created successfully, but failed to send welcome email.'
        });
      }

      res.status(201).json({ msg: `User '${name}' created successfully as a ${role}.` });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/admin/dashboard-data
// @desc    Get aggregated data for the admin dashboard
// @access  Private (Admin only)
router.get(
  '/dashboard-data',
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      // --- UPDATE: Fetch total counts along with recent users ---
      const [
        studentCount,
        teacherCount,
        parentCount,
        staffCount, // Assuming you have a 'staff' role
        recentStudents,
        recentTeachers,
        recentParents,
        recentStaff
      ] = await Promise.all([
        User.countDocuments({ role: 'student', schoolName: req.user.schoolName }), // Filter by school
        User.countDocuments({ role: 'teacher', schoolName: req.user.schoolName }), // Filter by school
        User.countDocuments({ role: 'parent', schoolName: req.user.schoolName }),  // Filter by school
        User.countDocuments({ role: 'staff', schoolName: req.user.schoolName }),   // Filter by school
        User.find({ role: 'student', schoolName: req.user.schoolName }).sort({ createdAt: -1 }).limit(5).select('adminName details.class createdAt'), // Increased limit? Added date? Filter by school
        User.find({ role: 'teacher', schoolName: req.user.schoolName }).sort({ createdAt: -1 }).limit(5).select('adminName details.subject createdAt'),// Increased limit? Added date? Filter by school
        User.find({ role: 'parent', schoolName: req.user.schoolName }).sort({ createdAt: -1 }).limit(5).select('adminName createdAt'),   // Increased limit? Added date? Filter by school
        User.find({ role: 'staff', schoolName: req.user.schoolName }).sort({ createdAt: -1 }).limit(5).select('adminName details.role createdAt'),     // Increased limit? Added date? Filter by school
      ]);

      // --- Keep your static data for now, replace later if needed ---
      // TODO: Replace with dynamic data fetched from database (e.g., actual student counts per class/month)
      const admissionsData = [ { month: 'Apr', admissions: 25 }, { month: 'May', admissions: 42 }, { month: 'Jun', admissions: 55 }, { month: 'Jul', admissions: 30 }, { month: 'Aug', admissions: 18 }, { month: 'Sep', admissions: 12 } ];
      // TODO: Replace with dynamic data fetched from a Fees collection
      const recentFees = [ { _id: 'F01', student: 'Aryan Gupta', amount: '₹5,000'}, { _id: 'F02', student: 'Priya Singh', amount: '₹4,500'} ];

      // --- UPDATE: Add the fetched counts to the response ---
      const dashboardData = {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalParents: parentCount,
        totalStaff: staffCount,
        admissionsData, // Keep static chart data for now
        recentStudents,
        recentTeachers,
        recentParents,
        recentStaff,
        recentFees // Keep static fee data for now
        // TODO: Add totalClasses if you have a Class model later
        // TODO: Add monthlyRevenue if you have a Fees model later
      };

      res.json(dashboardData);

    } catch (err) {
      console.error("Dashboard Data Error:", err.message);
      res.status(500).send('Server Error fetching dashboard data');
    }
  }
);


// @route   PUT /api/admin/profile
// @desc    Update admin's profile (name and school name)
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  const { adminName, schoolName } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (schoolName !== user.schoolName) {
      // Check if school name is already taken by ANOTHER admin
      if (schoolName) { // Ensure schoolName is provided
           const existingAdminSchool = await User.findOne({ schoolName, role: 'admin', _id: { $ne: userId } });
           if (existingAdminSchool) {
               return res.status(400).json({ message: 'This school name is already registered by another admin.' });
           }
       }


      // Check 90-day rule
      if (user.schoolNameLastUpdated) {
        const lastUpdate = new Date(user.schoolNameLastUpdated);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        if (lastUpdate > ninetyDaysAgo) {
          const daysRemaining = 90 - Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));
          return res.status(400).json({
            message: `You can only change your school name once every 90 days. Please try again in ${daysRemaining} days.`
          });
        }
      }
      user.schoolNameLastUpdated = new Date(); // Update timestamp only if name changes
    }


    user.adminName = adminName;
    user.schoolName = schoolName;

    await user.save();

    // Create and send a new token with updated user info
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        adminName: user.adminName, // Send updated name
        schoolName: user.schoolName, // Send updated school name
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        // Send back the new token so the frontend can stay up-to-date
        res.json({ message: 'Profile updated successfully!', token });
      }
    );

  } catch (error) {
    // This duplicate key error should now only happen for email, handled elsewhere
    // if (error.code === 11000) {
    //   return res.status(400).json({ message: 'That school name is already taken.' });
    // }
    console.error("Profile Update Error:", error);
    res.status(500).send('Server Error updating profile');
  }
});

module.exports = router;
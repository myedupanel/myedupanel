const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// --- Hum FeeRecord model ko import kar rahe hain ---
const FeeRecord = require('../models/FeeRecord'); 
const sendEmail = require('../utils/sendEmail');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// @route   POST /api/admin/create-user
// @desc    Admin creates a new user (teacher, student, parent)
// @access  Private (Admin only)
// --- Is route mein koi badlaav nahi hai ---
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
        adminName: name,
        schoolName: req.user.schoolName,
        email,
        role,
        password: temporaryPassword,
        ...(role === 'student' && { 'details.class': studentClass }),
        ...(role === 'parent' && { 'details.children': [parentOf] })
      };

      user = new User(newUserDetails);
      await user.save();

      try {
        const io = req.app.get('socketio');
        if (io) {
          io.emit('updateDashboard');
          console.log('Socket.IO: Dashboard update event bheja gaya.');
        } else {
          console.log('Socket.IO: Instance nahi mila.');
        }
      } catch (socketError) {
        console.error("Socket emit error:", socketError);
      }

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
// 
// ===== YAHAN SABHI DYNAMIC QUERIES HAIN =====
//
router.get(
  '/dashboard-data',
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const [
        studentCount,
        teacherCount,
        parentCount,
        staffCount,
        recentStudents,
        recentTeachers,
        recentParents,
        recentStaff,
        recentPaidFeeRecords, 
        admissionsDataRaw 
      ] = await Promise.all([
        // Counts
        User.countDocuments({ role: 'student', schoolName: req.user.schoolName }),
        User.countDocuments({ role: 'teacher', schoolName: req.user.schoolName }),
        User.countDocuments({ role: 'parent', schoolName: req.user.schoolName }),
        User.countDocuments({ role: 'staff', schoolName: req.user.schoolName }),
        // Recent Users
        User.find({ role: 'student', schoolName: req.user.schoolName }).sort({ createdAt: -1 }).limit(5).select('adminName details.class createdAt'),
        User.find({ role: 'teacher', schoolName: req.user.schoolName }).sort({ createdAt: -1 }).limit(5).select('adminName details.subject createdAt'),
        User.find({ role: 'parent', schoolName: req.user.schoolName }).sort({ createdAt: -1 }).limit(5).select('adminName createdAt'),
        User.find({ role: 'staff', schoolName: req.user.schoolName }).sort({ createdAt: -1 }).limit(5).select('adminName details.role createdAt'),
        
        // --- Recent Payments ki Asli Query ---
        FeeRecord.find({ 
          // schoolId: req.user.schoolName, // Hum maan rahe hain schoolId aapke 'User' model se aayega
          status: 'Paid' 
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('studentId', 'adminName') // 'studentId' field ko User model se 'adminName' laakar bharo
        .select('amount createdAt studentId'),

        // --- Student Admission Chart ki Asli Query (Aggregation) ---
        User.aggregate([
          { $match: { role: 'student', schoolName: req.user.schoolName } },
          { $group: {
              _id: { month: { $month: "$createdAt" } },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.month": 1 } }
        ])
      ]);

      // --- Chart ke Data ko Format Karna ---
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const admissionsMap = new Map(monthNames.map((name, index) => [index + 1, { name, admissions: 0 }]));
      
      admissionsDataRaw.forEach(item => {
        admissionsMap.set(item._id.month, {
          name: monthNames[item._id.month - 1],
          admissions: item.count
        });
      });
      const admissionsData = Array.from(admissionsMap.values());
      
      // --- BADLAAV 5: Recent Payments Data ko Frontend ke liye Format Karna ---
      // ===== YEH HAI AAPKA JAVASCRIPT FIX (BINA 'as any') =====
      const recentFees = recentPaidFeeRecords.map(record => ({
        _id: record._id,
        // Hum check kar rahe hain ki studentId aur uspe adminName maujood hai ya nahi
        student: record.studentId && record.studentId.adminName ? record.studentId.adminName : 'Unknown Student',
        amount: `₹${record.amount.toLocaleString('en-IN')}`, // Amount ko format kiya
        date: record.createdAt.toLocaleDateString('en-IN') // Date ko format kiya
      }));
      // --- END BADLAAV 5 ---


      // --- Final Data Object ---
      const dashboardData = {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalParents: parentCount,
        totalStaff: staffCount,
        admissionsData, // Ab yeh DYNAMIC hai
        recentStudents,
        recentTeachers,
        recentParents,
        recentStaff,
        recentFees      // Ab yeh DYNAMIC hai
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
// --- Is route mein koi badlaav nahi hai ---
router.put('/profile', authMiddleware, async (req, res) => {
  const { adminName, schoolName } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (schoolName !== user.schoolName) {
      if (schoolName) {
           const existingAdminSchool = await User.findOne({ schoolName, role: 'admin', _id: { $ne: userId } });
           if (existingAdminSchool) {
               return res.status(400).json({ message: 'This school name is already registered by another admin.' });
           }
       }
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
      user.schoolNameLastUpdated = new Date();
    }


    user.adminName = adminName;
    user.schoolName = schoolName;

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        adminName: user.adminName,
        schoolName: user.schoolName,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ message: 'Profile updated successfully!', token });
      }
    );

  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).send('Server Error updating profile');
  }
});

module.exports = router;
// routes/adminRoutes.js (or admin.js based on your server.js)
const mongoose = require('mongoose'); // Needed for ObjectId
const Student = require('../models/Student'); // Assuming path is correct
const Teacher = require('../models/Teacher'); // Assuming path is correct
const Parent = require('../models/Parent'); // Assuming you have this model
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // User model uses schoolId and name
const School = require('../models/School'); // Import School model
const FeeRecord = require('../models/FeeRecord'); // Assuming this path is correct
const sendEmail = require('../utils/sendEmail');
// Ensure adminMiddleware is correctly imported
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// @route   POST /api/admin/create-user
// @desc    Admin creates a new user (teacher, student, parent)
// @access  Private (Admin only)
// --- Code updated to use schoolId and name ---
router.post(
  '/create-user',
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const { name, email, role, studentClass, parentOf } = req.body;
      const schoolIdFromAdmin = req.user.schoolId;

      if (!name || !email || !role) return res.status(400).json({ msg: 'Please provide name, email, and role.' });
      if (role === 'student' && !studentClass) return res.status(400).json({ msg: 'Please provide class for the student.' });
      if (!schoolIdFromAdmin) return res.status(400).json({ msg: 'Admin school information missing.' });

      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: 'User with this email already exists.' });

      const temporaryPassword = crypto.randomBytes(8).toString('hex');
      const newUserDetails = {
        name: name, schoolId: schoolIdFromAdmin, email, role, password: temporaryPassword, isVerified: true, // Assuming admin-created users are auto-verified
        ...(role === 'student' && { 'details.class': studentClass }), // Adapt if 'details' isn't in your User model
        ...(role === 'parent' && { 'details.children': [parentOf] }) // Adapt if 'details' isn't in your User model
      };
      user = new User(newUserDetails);
      await user.save();

      // Socket emit logic (ensure req.io is passed correctly)
      if (req.io) { req.io.emit('updateDashboard'); }
      else { console.warn('Socket.IO instance not found on req object for create-user.'); }

      // Send Welcome Email (Optional)
      try {
        const subject = 'Your SchoolPro Account has been created!';
        const message = `<h1>Welcome to SchoolPro, ${name}!</h1><p>An admin has created an account for you...</p><p><strong>Email:</strong> ${email}</p><p><strong>Temporary Password:</strong> ${temporaryPassword}</p><p>Please log in and change your password...</p>`;
        await sendEmail({ to: user.email, subject, html: message });
      } catch (emailError) {
        console.error("Could not send creation email:", emailError);
        // Proceed but inform frontend
        return res.status(201).json({ msg: 'User created successfully, but failed to send welcome email.' });
      }
      res.status(201).json({ msg: `User '${name}' created successfully as a ${role}.` });
    } catch (err) {
      console.error("Create User Error:", err.message);
       if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(' ') });
        }
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/admin/dashboard-data
// @desc    Get aggregated data for the admin dashboard
// @access  Private (Admin only)
// --- Code updated to use schoolId ---
router.get(
  '/dashboard-data',
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const schoolIdFromAdmin = req.user.schoolId;
      if (!schoolIdFromAdmin) return res.status(400).json({ msg: 'Admin school information missing.' });

      // Use Mongoose ObjectId for matching in aggregation if schoolIdFromAdmin is a string
      let schoolObjectId;
       try {
           schoolObjectId = mongoose.Types.ObjectId.isValid(schoolIdFromAdmin) ? new mongoose.Types.ObjectId(schoolIdFromAdmin) : null;
           if (!schoolObjectId) {
               console.error(`[GET /dashboard-data] Invalid school ID format received from token: ${schoolIdFromAdmin}`);
               return res.status(400).json({ msg: 'Invalid school ID format.' });
           }
       } catch (idError) {
            console.error(`[GET /dashboard-data] Error converting school ID: ${idError.message}`);
            return res.status(500).json({ msg: 'Server error processing school ID.' });
       }


      const [ studentCount, teacherCount, parentCount, staffCount, recentStudents, recentTeachers, recentParents, recentStaff, recentPaidFeeRecords, admissionsDataRaw ] = await Promise.all([
        User.countDocuments({ role: 'student', schoolId: schoolIdFromAdmin }), User.countDocuments({ role: 'teacher', schoolId: schoolIdFromAdmin }),
        User.countDocuments({ role: 'parent', schoolId: schoolIdFromAdmin }), User.countDocuments({ role: 'staff', schoolId: schoolIdFromAdmin }),
        Student.find({ schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name class createdAt'),
        Teacher.find({ schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name subject createdAt'),
        Parent.find({ schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name createdAt'), // Assumes Parent model exists and has schoolId
        User.find({ role: 'staff', schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name createdAt'), // Assumes staff are Users with schoolId
        FeeRecord.find({ schoolId: schoolIdFromAdmin, status: 'Paid' }).sort({ createdAt: -1 }).limit(5)
          .populate({ path: 'studentId', select: 'name' }) // Populate student name
          .select('amount createdAt studentId'),
        User.aggregate([ // Aggregate student *Users* by schoolId
          { $match: { role: 'student', schoolId: schoolObjectId } }, // Use converted ObjectId
          { $group: { _id: { month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
          { $project: { _id: 0, month: "$_id.month", admissions: "$count" } }, { $sort: { "month": 1 } }
        ])
      ]);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const admissionsMap = new Map(monthNames.map((name, index) => [index + 1, { name, admissions: 0 }]));
      admissionsDataRaw.forEach(item => { if (item.month >= 1 && item.month <= 12) { admissionsMap.set(item.month, { name: monthNames[item.month - 1], admissions: item.admissions }); } });
      const admissionsData = Array.from(admissionsMap.values());
      const recentFees = recentPaidFeeRecords.map(record => ({ _id: record._id.toString(), student: record.studentId?.name || 'Unknown Student', amount: `₹${record.amount.toLocaleString('en-IN')}`, date: record.createdAt ? record.createdAt.toISOString() : 'No Date' }));
      const dashboardData = { totalStudents: studentCount, totalTeachers: teacherCount, totalParents: parentCount, totalStaff: staffCount, admissionsData, recentStudents, recentTeachers, recentParents, recentStaff, recentFees };
      res.json(dashboardData);
    } catch (err) { console.error("Dashboard Data Error:", err.message, err.stack); res.status(500).send('Server Error fetching dashboard data'); }
  }
);


// @route   PUT /api/admin/profile
// @desc    Update admin's profile name AND associated school name
// @access  Private (Admin only)
// --- Code includes school update, 90-day rule, timestamp, and logging ---
router.put('/profile', authMiddleware, async (req, res) => {
  const { adminName, schoolName } = req.body; // Receive adminName from frontend
  const userId = req.user.id;
  console.log(`[PUT /profile] User ID: ${userId} requested update. Name: ${adminName}, School: ${schoolName}`);

  try {
    // 1. Find the User
    const user = await User.findById(userId);
    if (!user) { console.log(`[PUT /profile] Error: User not found for ID: ${userId}`); return res.status(404).json({ message: 'User not found' }); }
    if (user.role !== 'admin') { console.log(`[PUT /profile] Error: User ${userId} is not an admin.`); return res.status(403).json({ message: 'Only admins can update profiles via this route.' }); }

    // 2. Find the associated School
    const school = await School.findById(user.schoolId);
    if (!school) { console.log(`[PUT /profile] Error: School not found for user ${userId} with schoolId ${user.schoolId}`); return res.status(404).json({ message: 'Associated school not found for this user.' }); }
    console.log(`[PUT /profile] Found User: ${user.name}, School: ${school.name}`);

    let schoolNameChanged = false;
    let newSchoolNameForToken = school.name;
    let userNeedsSave = false; // Flag to track if user document needs saving

    // 3. Handle School Name Change
    if (schoolName && schoolName !== school.name) {
      console.log(`[PUT /profile] School name change requested from '${school.name}' to '${schoolName}'`);
      // a. Check 90-day rule
      if (user.schoolNameLastUpdated) {
        const lastUpdate = new Date(user.schoolNameLastUpdated);
        const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        console.log(`[PUT /profile] Checking 90-day rule. Last update: ${lastUpdate}, 90 days ago: ${ninetyDaysAgo}`);
        if (lastUpdate > ninetyDaysAgo) {
          const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime()); const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)); const daysRemaining = Math.max(0, 90 - daysPassed);
          console.log(`[PUT /profile] 90-day rule failed. Days remaining: ${daysRemaining}`);
          return res.status(400).json({ message: `You can only change your school name once every 90 days. Please try again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.` });
        }
      } else { console.log(`[PUT /profile] No previous school name update found.`); }

      // b. Check if NEW name is taken
      console.log(`[PUT /profile] Checking if school name '${schoolName}' is already taken...`);
      const existingSchoolWithNewName = await School.findOne({ name: schoolName, _id: { $ne: user.schoolId } });
      if (existingSchoolWithNewName) { console.log(`[PUT /profile] Error: School name '${schoolName}' is already taken by school ID ${existingSchoolWithNewName._id}`); return res.status(400).json({ message: 'This school name is already registered by another school.' }); }
      console.log(`[PUT /profile] School name '${schoolName}' is available.`);

      // c. Update School document
      school.name = schoolName;
      console.log(`[PUT /profile] Attempting to save updated school name '${school.name}'...`);
      await school.save(); // Save changes to the school document
      console.log(`[PUT /profile] School name saved successfully.`);

      // d. Update User timestamp
      user.schoolNameLastUpdated = new Date();
      schoolNameChanged = true;
      newSchoolNameForToken = school.name;
      userNeedsSave = true; // Mark user for saving
      console.log(`[PUT /profile] User timestamp updated. Needs save.`);
    } else { console.log(`[PUT /profile] School name not changed or not provided.`); }

    // 4. Handle User Name Change (using adminName from body)
    if (adminName && adminName !== user.name) {
        console.log(`[PUT /profile] User name change requested from '${user.name}' to '${adminName}'`);
        user.name = adminName; // Update user's 'name' field
        userNeedsSave = true; // Mark user for saving
        console.log(`[PUT /profile] User name updated. Needs save.`);
    } else { console.log(`[PUT /profile] User name not changed or not provided.`); }

    // 5. Save User document IF needed
    if (userNeedsSave) {
        console.log(`[PUT /profile] Attempting to save user document...`);
        await user.save();
        console.log(`[PUT /profile] User document saved successfully.`);
    } else { console.log(`[PUT /profile] No changes needed for user document. Skipping save.`); }

    // 6. Generate NEW token
    const payload = { user: { id: user.id, role: user.role, name: user.name, schoolId: user.schoolId, schoolName: newSchoolNameForToken } };
    console.log(`[PUT /profile] Generating new token with payload:`, payload.user);

    jwt.sign( payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) { console.error("[PUT /profile] Error signing token:", err); return res.status(500).send('Server Error generating authentication token.'); };
        console.log(`[PUT /profile] Token generated. Sending success response.`);
        res.json({ message: 'Profile updated successfully!', token }); // Send new token
      }
    );

  } catch (error) {
     console.error("[PUT /profile] CATCH BLOCK ERROR:", error.message, error.stack);
     if (error.code === 11000 && error.keyPattern?.name) { // Use optional chaining for safety
         return res.status(400).json({ message: 'Failed to update school name, it might already be taken (DB constraint).' });
     }
      if (error.name === 'ValidationError') {
         const messages = Object.values(error.errors).map(val => val.message);
         return res.status(400).json({ message: messages.join(' ') });
      }
    res.status(500).send('Server Error updating profile');
  }
});

module.exports = router;
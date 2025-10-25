// routes/admin.js (or adminRoutes.js)
const mongoose = require('mongoose'); // Needed for ObjectId
const Student = require('../models/Student'); // Assuming path is correct
const Teacher = require('../models/Teacher'); // Assuming path is correct
const Parent = require('../models/Parent'); // Assuming you have this model and path is correct
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
// @desc    Admin creates a new user (teacher, student, parent) -- STAFF CREATION REMOVED
// @access  Private (Admin only)
router.post(
  '/create-user',
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const { name, email, role, studentClass, parentOf } = req.body;
      const schoolIdFromAdmin = req.user.schoolId;

      // --- FIX: Check if the role is 'staff' and return error ---
      if (role === 'staff') {
          console.log("[POST /create-user] Attempted to create staff via wrong route.");
          // Send an error telling the frontend to use the correct endpoint
          return res.status(400).json({ msg: 'Staff creation should be done via the /api/staff endpoint.' });
      }
      // --- END FIX ---

      // Validation for other roles (teacher, student, parent)
      if (!name || !email || !role) return res.status(400).json({ msg: 'Please provide name, email, and role.' });
      if (role === 'student' && !studentClass) return res.status(400).json({ msg: 'Please provide class for the student.' });
      // Parent role might need parentOf validation if applicable
      if (!schoolIdFromAdmin) return res.status(400).json({ msg: 'Admin school information missing.' });

      // Check for existing user (for student, teacher, parent)
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: 'User with this email already exists.' });

      const temporaryPassword = crypto.randomBytes(8).toString('hex');
      const newUserDetails = {
        name: name, schoolId: schoolIdFromAdmin, email, role, password: temporaryPassword, isVerified: true, // Assuming admin-created users are auto-verified
        // Adapt if 'details' isn't in your User model
        ...(role === 'student' && { 'details.class': studentClass }),
        ...(role === 'parent' && { 'details.children': [parentOf] })
      };
      user = new User(newUserDetails);
      await user.save();

      // Socket emit logic (remains the same)
      if (req.io) { req.io.emit('updateDashboard'); }
      else { console.warn('Socket.IO instance not found on req object for create-user.'); }

      // Send Welcome Email (Optional) (remains the same)
      try {
        const subject = 'Your SchoolPro Account has been created!';
        const message = `<h1>Welcome...</h1><p>Email: ${email}</p><p>Temp Password: ${temporaryPassword}</p>`; // Simplified message example
        await sendEmail({ to: user.email, subject, html: message });
      } catch (emailError) {
        console.error("Could not send creation email:", emailError);
        return res.status(201).json({ msg: 'User created successfully, but failed to send welcome email.' });
      }
      res.status(201).json({ msg: `User '${name}' created successfully as a ${role}.` });
    } catch (err) {
      console.error("Create User Error:", err.message);
       if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(' ') });
        }
       if (err.code === 11000) { // Catch duplicate email error during save
            return res.status(400).json({ msg: 'User with this email already exists (database error).' });
       }
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/admin/dashboard-data
// @desc    Get aggregated data for the admin dashboard
// @access  Private (Admin only)
// --- Code updated to use schoolId AND aggregate correctly ---
// (This route remains unchanged from the previous version)
router.get(
  '/dashboard-data',
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    console.log("[GET /dashboard-data] Request received.");
    try {
      const schoolIdFromAdmin = req.user.schoolId;
      if (!schoolIdFromAdmin) { /* ... error handling ... */ return res.status(400).json({ msg: 'Admin school information missing.' });}
      console.log(`[GET /dashboard-data] Fetching data for schoolId: ${schoolIdFromAdmin}`);
      let schoolObjectId;
       try {
           schoolObjectId = mongoose.Types.ObjectId.isValid(schoolIdFromAdmin) ? new mongoose.Types.ObjectId(schoolIdFromAdmin) : null;
           if (!schoolObjectId) { /* ... error handling ... */ return res.status(400).json({ msg: 'Invalid school ID format.' }); }
       } catch (idError) { /* ... error handling ... */ return res.status(500).json({ msg: 'Server error processing school ID.' }); }


      const [ studentCount, teacherCount, parentCount, staffCount, recentStudents, recentTeachers, recentParents, recentStaff, recentPaidFeeRecords, admissionsDataRaw, classCountsRaw ] = await Promise.all([
        User.countDocuments({ role: 'student', schoolId: schoolIdFromAdmin }), User.countDocuments({ role: 'teacher', schoolId: schoolIdFromAdmin }),
        User.countDocuments({ role: 'parent', schoolId: schoolIdFromAdmin }), User.countDocuments({ role: 'staff', schoolId: schoolIdFromAdmin }), // Counts staff Users
        Student.find({ schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name class createdAt'),
        Teacher.find({ schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name subject createdAt'),
        Parent.find({ schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name createdAt'), // Assumes Parent model exists and has schoolId
        User.find({ role: 'staff', schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name createdAt'), // Gets recent staff Users
        FeeRecord.find({ schoolId: schoolIdFromAdmin, status: 'Paid' }).sort({ createdAt: -1 }).limit(5) .populate({ path: 'studentId', select: 'name' }).select('amount createdAt studentId'),
        User.aggregate([ { $match: { role: 'student', schoolId: schoolObjectId } }, { $project: { month: { $month: "$createdAt" } } }, { $group: { _id: "$month", admissions: { $sum: 1 } } }, { $project: { _id: 0, month: "$_id", admissions: 1 } }, { $sort: { "month": 1 } } ]),
        Student.aggregate([ { $match: { schoolId: schoolObjectId } }, { $group: { _id: "$class", count: { $sum: 1 } } }, { $project: { _id: 0, name: "$_id", count: 1 } }, { $sort: { "name": 1 } } ])
      ]).catch(err => { console.error("[GET /dashboard-data] Error during Promise.all:", err); throw err; });
      console.log("[GET /dashboard-data] Raw Admissions Data:", admissionsDataRaw);
      console.log("[GET /dashboard-data] Raw Class Counts:", classCountsRaw);

      // --- Formatting logic remains the same ---
      const monthNames = ["Jan", "Feb", /*...*/ "Dec"];
      const admissionsMap = new Map(/*...*/); admissionsDataRaw.forEach(/*...*/); const admissionsData = Array.from(admissionsMap.values());
      console.log("[GET /dashboard-data] Formatted Admissions (Month):", admissionsData);
      const classCounts = classCountsRaw;
      console.log("[GET /dashboard-data] Formatted Class Counts:", classCounts);
      const recentFees = recentPaidFeeRecords.map(record => ({ _id: record._id.toString(), student: record.studentId?.name || 'Unknown Student', amount: `₹${record.amount.toLocaleString('en-IN')}`, date: record.createdAt ? record.createdAt.toISOString() : 'No Date' }));
      // --- End Formatting ---

      const dashboardData = { totalStudents: studentCount, totalTeachers: teacherCount, totalParents: parentCount, totalStaff: staffCount, admissionsData, classCounts, recentStudents, recentTeachers, recentParents, recentStaff, recentFees };
      console.log("[GET /dashboard-data] Sending final dashboard data.");
      res.json(dashboardData);
    } catch (err) { console.error("[GET /dashboard-data] CATCH BLOCK ERROR:", err.message, err.stack); res.status(500).send('Server Error fetching dashboard data'); }
  }
);


// @route   PUT /api/admin/profile
// @desc    Update admin's profile name AND associated school name
// @access  Private (Admin only)
// --- Code includes school update, 90-day rule, timestamp, and logging ---
// (This route remains unchanged from the previous confirmed version)
router.put(
    '/profile',
    authMiddleware,
    async (req, res) => {
        const { adminName, schoolName } = req.body;
        const userId = req.user.id;
        console.log(`[PUT /profile] START - User ID: ${userId}...`);
        if (!adminName || !schoolName) { /* ... error handling ... */ return res.status(400).json({ message: 'Full name and school name are required.' }); }
        try {
            const user = await User.findById(userId);
            if (!user) { /* ... error handling ... */ return res.status(404).json({ message: 'User not found' }); }
            if (user.role !== 'admin') { /* ... error handling ... */ return res.status(403).json({ message: 'Only admins can update profiles...' }); }
            const school = await School.findById(user.schoolId);
            if (!school) { /* ... error handling ... */ return res.status(404).json({ message: 'Associated school not found...' }); }
            console.log(`[PUT /profile] Found User: ${user.name}, School: ${school.name}`);
            let schoolNeedsSave = false; let userNeedsSave = false; let newSchoolNameForToken = school.name;
            const requestedSchoolNameTrimmed = schoolName.trim(); const currentSchoolNameTrimmed = school.name.trim();
            if (requestedSchoolNameTrimmed && requestedSchoolNameTrimmed !== currentSchoolNameTrimmed) {
                console.log(`[PUT /profile] School name change detected...`);
                if (user.schoolNameLastUpdated) { /* ... 90-day check ... */ } else { console.log(`[PUT /profile] No previous school name update found.`); }
                console.log(`[PUT /profile] Checking if school name '${requestedSchoolNameTrimmed}' is taken...`);
                const existingSchoolWithNewName = await School.findOne({ name: requestedSchoolNameTrimmed, _id: { $ne: user.schoolId } });
                if (existingSchoolWithNewName) { /* ... error handling ... */ return res.status(400).json({ message: 'This school name is already registered...' }); }
                console.log(`[PUT /profile] School name '${requestedSchoolNameTrimmed}' is available.`);
                school.name = requestedSchoolNameTrimmed; schoolNeedsSave = true; user.schoolNameLastUpdated = new Date(); userNeedsSave = true; newSchoolNameForToken = school.name;
                console.log(`[PUT /profile] School and User marked for update.`);
            } else { console.log(`[PUT /profile] School name not changed...`); }
            const requestedAdminNameTrimmed = adminName.trim();
            if (requestedAdminNameTrimmed && requestedAdminNameTrimmed !== user.name.trim()) {
                console.log(`[PUT /profile] User name change requested...`); user.name = requestedAdminNameTrimmed; userNeedsSave = true; console.log(`[PUT /profile] User name marked for update.`);
            } else { console.log(`[PUT /profile] User name not changed...`); }
            if (schoolNeedsSave) { console.log(`[PUT /profile] Saving school...`); await school.save(); console.log(`[PUT /profile] School saved.`); } else { console.log(`[PUT /profile] Skipping school save.`); }
            if (userNeedsSave) { console.log(`[PUT /profile] Saving user...`); await user.save(); console.log(`[PUT /profile] User saved.`); } else { console.log(`[PUT /profile] Skipping user save.`); }
            const payload = { user: { id: user.id, role: user.role, name: user.name, schoolId: user.schoolId, schoolName: newSchoolNameForToken } };
            console.log(`[PUT /profile] Generating token...`, payload.user);
            jwt.sign( payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
                if (err) { /* ... error handling ... */ return res.status(500).send('Server Error generating token.'); };
                console.log(`[PUT /profile] Sending success response.`); res.json({ message: 'Profile updated successfully!', token });
            });
        } catch (error) { /* ... existing error handling ... */ }
    }
);

module.exports = router; // Make sure router is exported
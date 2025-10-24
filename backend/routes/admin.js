// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // User model uses schoolId and name
const School = require('../models/School'); // Import School model
const FeeRecord = require('../models/FeeRecord'); // Assuming this path is correct
const sendEmail = require('../utils/sendEmail');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware'); // Assuming adminMiddleware checks role

// @route   POST /api/admin/create-user
// @desc    Admin creates a new user (teacher, student, parent)
// @access  Private (Admin only)
// --- THIS ROUTE NEEDS UPDATING to use schoolId, name ---
router.post(
  '/create-user',
  [authMiddleware, adminMiddleware], // Make sure adminMiddleware checks user.role === 'admin'
  async (req, res) => {
    try {
      // --- Use 'name' from body ---
      const { name, email, role, studentClass, parentOf } = req.body;
      // --- Get schoolId from token ---
      const schoolIdFromAdmin = req.user.schoolId;

      if (!name || !email || !role) {
        return res.status(400).json({ msg: 'Please provide name, email, and role.' });
      }
      if (role === 'student' && !studentClass) {
        return res.status(400).json({ msg: 'Please provide class for the student.' });
      }
      // --- Check for schoolId ---
      if (!schoolIdFromAdmin) {
         return res.status(400).json({ msg: 'Admin school information missing.' });
      }

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User with this email already exists.' });
      }

      const temporaryPassword = crypto.randomBytes(8).toString('hex');

      // --- Create User with 'name' and 'schoolId' ---
      const newUserDetails = {
        name: name, // Use 'name' field
        schoolId: schoolIdFromAdmin, // Assign admin's schoolId
        email,
        role,
        password: temporaryPassword, // Pre-save hook will hash
        isVerified: true, // Mark as verified since admin is creating? Or send verification? Decide your flow.
        // Add 'details' object if your User model uses it for class/parentOf
        ...(role === 'student' && { 'details.class': studentClass }),
        ...(role === 'parent' && { 'details.children': [parentOf] })
      };

      user = new User(newUserDetails);
      await user.save();

      // --- SOCKET EMIT (Needs req.io passed from server.js) ---
      if (req.io) {
          req.io.emit('updateDashboard'); // Signal dashboard update
          // Optional: Emit specific event like 'user_created'
      } else {
          console.warn('Socket.IO instance not found on req object for create-user.');
      }
      // --- End Socket Emit ---

      // Send Welcome Email (Optional)
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
        // Don't fail the whole request if email fails
        return res.status(201).json({
            msg: 'User created successfully, but failed to send welcome email.'
        });
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
// --- THIS ROUTE NEEDS UPDATING to use schoolId ---
router.get(
  '/dashboard-data',
  [authMiddleware, adminMiddleware], // Ensure adminMiddleware checks role
  async (req, res) => {
    try {
      // --- Get schoolId from token ---
      const schoolIdFromAdmin = req.user.schoolId;
      if (!schoolIdFromAdmin) {
          return res.status(400).json({ msg: 'Admin school information missing.' });
      }

      // --- Use schoolId in all queries ---
      const [
        studentCount,
        teacherCount,
        parentCount,
        staffCount,
        // --- NOTE: User model no longer stores recent users directly, fetch related models ---
        // Fetch recent Students using schoolId
        recentStudents,
        // Fetch recent Teachers using schoolId
        recentTeachers,
        // Need Parent model to fetch recent Parents using schoolId
        recentParents,
         // Need Staff model or User with role 'staff'
        recentStaff,
        recentPaidFeeRecords,
        admissionsDataRaw
      ] = await Promise.all([
        // Counts using User model and schoolId
        User.countDocuments({ role: 'student', schoolId: schoolIdFromAdmin }),
        User.countDocuments({ role: 'teacher', schoolId: schoolIdFromAdmin }),
        User.countDocuments({ role: 'parent', schoolId: schoolIdFromAdmin }),
        User.countDocuments({ role: 'staff', schoolId: schoolIdFromAdmin }),

        // Fetch recent records from specific models using schoolId
        // Assuming Student model has schoolId, name, class, createdAt
        Student.find({ schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name class createdAt'),
        // Assuming Teacher model has schoolId, name, subject, createdAt
        Teacher.find({ schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name subject createdAt'),
        // Add similar queries for Parent and Staff models if they exist
         Parent.find({ schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name createdAt'), // Example
         User.find({ role: 'staff', schoolId: schoolIdFromAdmin }).sort({ createdAt: -1 }).limit(5).select('name createdAt'), // Example if staff are Users

        // Fee Records (Assuming FeeRecord has schoolId and populates studentId which is a User ref)
        FeeRecord.find({
          schoolId: schoolIdFromAdmin, // Filter fees by schoolId
          status: 'Paid'
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
            path: 'studentId', // Assuming studentId links to Student model
            select: 'name' // Select name from Student model
         })
        .select('amount createdAt studentId'),

        // Admission Chart (Aggregate Users with role 'student' and schoolId)
        User.aggregate([
          { $match: { role: 'student', schoolId: mongoose.Types.ObjectId(schoolIdFromAdmin) } }, // Match by schoolId
          { $group: {
              _id: { month: { $month: "$createdAt" } },
              count: { $sum: 1 }
            }
          },
          { $project: { // Project to ensure correct output format
              _id: 0, // Exclude the default _id
              month: "$_id.month",
              admissions: "$count"
             }
          },
          { $sort: { "month": 1 } } // Sort by month number
        ])
      ]);

      // --- Format Chart Data ---
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      // Initialize map for all months
      const admissionsMap = new Map(monthNames.map((name, index) => [index + 1, { name, admissions: 0 }]));
      // Fill map with data from aggregation
      admissionsDataRaw.forEach(item => {
        if (item.month >= 1 && item.month <= 12) { // Ensure month is valid
             admissionsMap.set(item.month, {
               name: monthNames[item.month - 1],
               admissions: item.admissions
             });
        }
      });
      const admissionsData = Array.from(admissionsMap.values()); // Convert map values to array

      // --- Format Recent Payments ---
      const recentFees = recentPaidFeeRecords.map(record => ({
        _id: record._id.toString(),
        // Ensure studentId and its name property exist before accessing
        student: record.studentId && record.studentId.name ? record.studentId.name : 'Unknown Student',
        amount: `₹${record.amount.toLocaleString('en-IN')}`,
        // Format date safely
        date: record.createdAt ? record.createdAt.toISOString() : 'No Date' // Send ISO string for frontend flexibility
      }));

      // --- Final Data Object ---
      const dashboardData = {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalParents: parentCount,
        totalStaff: staffCount,
        admissionsData, // Dynamic chart data
        recentStudents, // Dynamic recent students list
        recentTeachers, // Dynamic recent teachers list
        recentParents,  // Dynamic recent parents list (example)
        recentStaff,    // Dynamic recent staff list (example)
        recentFees      // Dynamic recent fees list
        // TODO: Add totalClasses (requires Class model query)
        // TODO: Add monthlyRevenue (requires FeeRecord aggregation)
      };

      res.json(dashboardData);

    } catch (err) {
      console.error("Dashboard Data Error:", err.message, err.stack); // Log stack trace
      res.status(500).send('Server Error fetching dashboard data');
    }
  }
);


// @route   PUT /api/admin/profile
// @desc    Update admin's profile name AND associated school name
// @access  Private (Admin only)
// --- THIS ROUTE IS FULLY UPDATED ---
router.put('/profile', authMiddleware, async (req, res) => {
  // --- Receive 'adminName' from body, but map it to user's 'name' field ---
  const { adminName, schoolName } = req.body;
  const userId = req.user.id; // Get user ID from token

  try {
    // 1. Find the User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Only admins can use this specific route? Add role check if needed.
    if (user.role !== 'admin') {
         return res.status(403).json({ message: 'Only admins can update profiles via this route.' });
    }

    // 2. Find the associated School using user.schoolId
    const school = await School.findById(user.schoolId);
    if (!school) {
        // This case should ideally not happen if signup logic is correct
        return res.status(404).json({ message: 'Associated school not found for this user.' });
    }

    let schoolNameChanged = false;
    let newSchoolNameForToken = school.name; // Start with current name

    // 3. Handle School Name Change (if requested and different)
    if (schoolName && schoolName !== school.name) {
      // a. Check 90-day rule on the User document
      if (user.schoolNameLastUpdated) {
        const lastUpdate = new Date(user.schoolNameLastUpdated);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        if (lastUpdate > ninetyDaysAgo) {
          const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime());
          // Calculate remaining days more accurately
          const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const daysRemaining = 90 - daysPassed;
          return res.status(400).json({
            message: `You can only change your school name once every 90 days. Please try again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`
          });
        }
      }

      // b. Check if the NEW school name is already taken by ANOTHER school
      const existingSchoolWithNewName = await School.findOne({
          name: schoolName,
          _id: { $ne: user.schoolId } // Check schools other than the current user's school
      });
      if (existingSchoolWithNewName) {
        return res.status(400).json({ message: 'This school name is already registered by another school.' });
      }

      // c. Update the School document's name
      school.name = schoolName;
      await school.save(); // Save changes to the school document

      // d. Update the timestamp on the User document
      user.schoolNameLastUpdated = new Date();
      schoolNameChanged = true;
      newSchoolNameForToken = school.name; // Use the newly saved name for the token
    }

    // 4. Handle User Name Change (if requested and different)
    if (adminName && adminName !== user.name) {
        user.name = adminName; // Update the 'name' field on the User model
    }

    // 5. Save the User document (might have updated name and/or timestamp)
    await user.save();

    // 6. Generate a NEW token with potentially updated info
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        name: user.name, // Send updated name
        schoolId: user.schoolId,
        schoolName: newSchoolNameForToken // Send potentially updated school name
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        // Send back the new token so frontend auth context updates
        res.json({ message: 'Profile updated successfully!', token });
      }
    );

  } catch (error) {
     console.error("Profile Update Error:", error.message, error.stack); // Log stack trace
     // Handle potential duplicate key error if school name update fails somehow (should be caught above)
     if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
         return res.status(400).json({ message: 'Failed to update school name, it might already be taken.' });
     }
      if (error.name === 'ValidationError') {
         const messages = Object.values(error.errors).map(val => val.message);
         return res.status(400).json({ message: messages.join(' ') });
      }
    res.status(500).send('Server Error updating profile');
  }
});

module.exports = router;
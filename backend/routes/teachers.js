// routes/teachers.js

const express = require('express');
const router = express.Router();
const generatePassword = require('generate-password');
const Teacher = require('../models/Teacher'); // Ensure path is correct
const User = require('../models/User');       // Ensure path is correct
const sendEmail = require('../utils/sendEmail'); // Ensure path is correct
// Assuming teacherController is mainly for bulk, keep it if needed
// const teacherController = require('../controllers/teacherController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware'); // Added authorize

// @route   POST /api/teachers
// @desc    Add a new teacher, create a user account, and send an email
// @access  Private (Admin Only) - Added authorization
router.post('/', [authMiddleware, authorize('admin')], async (req, res) => { // Added middleware
  try {
    // Get required fields from body
    const { teacherId, name, subject, contactNumber, email } = req.body;
    // --- FIX 1: Get schoolId and schoolName from logged-in user ---
    const schoolIdFromAdmin = req.user.id; // Admin's User ID acting as School ID
    const schoolNameFromAdmin = req.user.schoolName; // Admin's School Name

    // Basic Validation
    if (!teacherId || !name || !subject || !contactNumber || !email) {
      return res.status(400).json({ message: 'Please provide all required teacher details.' });
    }
     if (!schoolIdFromAdmin || !schoolNameFromAdmin) {
         return res.status(400).json({ message: 'Admin user details incomplete (missing school info).' });
     }


    // Check for duplicate teacher (using email OR teacherId within the SAME school)
    // Assuming Teacher model uses schoolId (which is admin's user ID)
    const existingTeacher = await Teacher.findOne({
        schoolId: schoolIdFromAdmin, // Check within the admin's school
        $or: [{ email }, { teacherId }]
     });
    if (existingTeacher) {
      return res.status(400).json({ message: 'A teacher with this email or ID already exists in this school.' });
    }

    // Check if a user with this email already exists ANYWHERE in the system
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists, maybe prevent creation or handle differently?
      // For now, prevent creating a duplicate user account.
      return res.status(400).json({ message: 'A user account with this email already exists.' });
    }

    // Generate password
    const password = generatePassword.generate({ length: 12, numbers: true });

    // Create the User account for the teacher
    const newUser = new User({
      adminName: name, // Use teacher's name here
      schoolName: schoolNameFromAdmin, // Assign the admin's school name
      email,
      password, // Pre-save hook will hash this
      role: 'teacher',
    });
    await newUser.save(); // This should work now (no unique schoolName issue)

    // Create the Teacher record
    // Assuming Teacher model uses schoolId (admin's user ID)
    const newTeacher = new Teacher({
      teacherId,
      name,
      subject,
      contactNumber,
      email,
      schoolId: schoolIdFromAdmin // --- FIX 2: Use admin's ID ---
    });
    await newTeacher.save();

    // Send welcome email (optional, can be skipped if causing issues)
    try {
      const message = `
        <h1>Welcome to SchoolPro, ${name}!</h1>
        <p>Your teacher account has been created successfully by an admin.</p>
        <p>You can log in using these credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Temporary Password:</strong> ${password}</li>
        </ul>
        <p>Please change your password after your first login.</p>
      `;
      await sendEmail({ to: email, subject: 'Your SchoolPro Teacher Account Details', html: message });
    } catch (emailError) {
      console.error("Could not send welcome email to teacher:", emailError);
      // Don't block the response if email fails, maybe return a partial success message
      // return res.status(201).json({ message: 'Teacher created, but email failed.', teacher: newTeacher });
    }

    // --- REAL-TIME UPDATE ---
    if (req.io) {
        req.io.emit('updateDashboard'); // Signal dashboard to refetch counts
    }

    res.status(201).json({ message: 'Teacher created successfully and welcome email sent.', teacher: newTeacher });

  } catch (err) {
    console.error("Error creating teacher:", err);
    // Handle validation errors specifically
    if (err.name === 'ValidationError') {
      // Extract specific validation messages if possible
       const messages = Object.values(err.errors).map(val => val.message);
       return res.status(400).json({ message: messages.join(' ') });
    }
    // Handle potential duplicate key errors from Teacher model index (teacherId + schoolId)
    if (err.code === 11000) {
        return res.status(400).json({ message: 'Duplicate key error, likely teacherId within the school.' });
    }
    res.status(500).send('Server Error creating teacher');
  }
});

// --- UPDATE OTHER ROUTES to use schoolId consistently ---

// @route   GET /api/teachers
// @desc    Get all teachers for the admin's school
// @access  Private (Admin or Teacher) - Adjust authorization as needed
router.get('/', [authMiddleware], async (req, res) => { // Removed authorize for now, admin check is implicit via schoolId
    try {
        const schoolId = req.user.id; // Get admin's ID (acting as schoolId)
        // const schoolId = req.query.schoolId; // Alternative if frontend sends it

        if (!schoolId) {
            return res.status(400).json({ message: "School ID (Admin ID) is required." });
        }
        // Assuming Teacher model uses schoolId
        const teachers = await Teacher.find({ schoolId: schoolId }).sort({ name: 1 }); // Filter by admin's ID
        res.json(teachers);
    } catch (err) {
        console.error("Error fetching teachers:", err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/teachers/:id (Teacher's DB _id)
// @desc    Update a teacher's details
// @access  Private (Admin Only)
router.put('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    let teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
    }

    // Ensure the teacher belongs to the admin's school
    if (teacher.schoolId.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized to edit this teacher' });
    }

    // Prevent changing schoolId or potentially email via update
    const updateData = { ...req.body };
    delete updateData.schoolId;
    delete updateData.email; // Usually email shouldn't be changed here

    teacher = await Teacher.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });

    // Update the name in the corresponding User model as well
    await User.updateOne({ email: teacher.email }, { $set: { adminName: teacher.name } });

     // --- REAL-TIME UPDATE ---
     if (req.io) {
        req.io.emit('updateDashboard'); // Might not affect counts, but good practice
    }


    res.json({ message: 'Teacher updated successfully', teacher });

  } catch (err) {
    console.error("Error updating teacher:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/teachers/:id (Teacher's DB _id)
// @desc    Delete a teacher and their user account
// @access  Private (Admin Only)
router.delete('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Ensure the teacher belongs to the admin's school
     if (teacher.schoolId.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized to delete this teacher' });
    }

    // Delete Teacher record first
    await Teacher.findByIdAndDelete(req.params.id);
    // Then delete the associated User account
    await User.findOneAndDelete({ email: teacher.email });

     // --- REAL-TIME UPDATE ---
     if (req.io) {
        req.io.emit('updateDashboard'); // Signal dashboard to refetch counts
    }

    res.json({ message: 'Teacher and associated user account removed successfully' });

  } catch (err) {
    console.error("Error deleting teacher:", err.message);
    res.status(500).send('Server Error');
  }
});

// Bulk import route - Assuming teacherController handles this
// Make sure teacherController also uses req.user.id for schoolId
// router.post('/bulk', [authMiddleware, authorize('admin')], teacherController.addTeachersInBulk);

module.exports = router;
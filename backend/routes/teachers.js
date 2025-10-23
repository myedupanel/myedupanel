// routes/teachers.js

const express = require('express');
const router = express.Router();
const generatePassword = require('generate-password');
const Teacher = require('../models/Teacher'); // Ensure path is correct
const User = require('../models/User');       // Ensure path is correct
const sendEmail = require('../utils/sendEmail'); // Ensure path is correct
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/teachers
// @desc    Add a new teacher, create a user account, and send an email
// @access  Private (Admin Only)
router.post('/', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    const { teacherId, name, subject, contactNumber, email } = req.body;

    // --- BADLAAV 1: Token se 'schoolId' lein ---
    const schoolIdFromToken = req.user.schoolId;
    // We might still need schoolName for the User model if it requires it, let's check User model... nope, User model requires schoolId. Perfect.

    // Basic Validation
    if (!teacherId || !name || !subject || !contactNumber || !email) {
      return res.status(400).json({ message: 'Please provide all required teacher details.' });
    }
     // --- BADLAAV 1 (continued): Check for schoolId from token ---
     if (!schoolIdFromToken) {
         return res.status(400).json({ message: 'Admin user details incomplete (missing school ID).' });
     }

    // --- BADLAAV 2: Duplicate teacher check using 'schoolId' ---
    const existingTeacher = await Teacher.findOne({
        schoolId: schoolIdFromToken, // Use schoolId for the check
        $or: [{ email }, { teacherId }]
     });
    if (existingTeacher) {
      return res.status(400).json({ message: 'A teacher with this email or ID already exists in this school.' });
    }

    // Check if a user with this email already exists (User email is globally unique)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user account with this email already exists.' });
    }

    // Generate password
    const password = generatePassword.generate({ length: 12, numbers: true });

    // --- BADLAAV 3: Create User account using 'name' and 'schoolId' ---
    const newUser = new User({
      name: name, // Use 'name' field
      schoolId: schoolIdFromToken, // Use 'schoolId' field
      email,
      password, // Pre-save hook will hash
      role: 'teacher', // Set role
    });
    await newUser.save();

    // --- BADLAAV 4: Create Teacher record using 'schoolId' ---
    const newTeacher = new Teacher({
      teacherId,
      name,
      subject: subject, // Keep subject as string based on model
      contactNumber,
      email,
      schoolId: schoolIdFromToken // Use 'schoolId' field
    });
    await newTeacher.save();

    // Send welcome email (no changes needed here)
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
      // Optional: Log this error more formally
    }

    // --- BADLAAV 5: Use req.io for real-time updates ---
    if (req.io) {
        req.io.emit('updateDashboard'); // Use req.io
        req.io.emit('teacher_added', newTeacher);
    } else {
       console.warn('Socket.IO instance not found on request object.'); // More specific warning
    }

    res.status(201).json({ message: 'Teacher created successfully and welcome email sent.', teacher: newTeacher });

  } catch (err) {
    console.error("Error creating teacher:", err);
    if (err.name === 'ValidationError') {
       const messages = Object.values(err.errors).map(val => val.message);
       return res.status(400).json({ message: messages.join(' ') });
    }
    if (err.code === 11000) {
        // --- BADLAAV 6: Update E11000 message for new index ---
        // The unique index is now on { teacherId: 1, schoolId: 1 } OR { email: 1 } in User model
        if (err.keyPattern && err.keyPattern.email) {
             return res.status(400).json({ message: 'A user account with this email already exists.' });
        } else {
             return res.status(400).json({ message: 'A teacher with this ID already exists in this school (Database conflict).' });
        }
    }
    res.status(500).send('Server Error creating teacher');
  }
});

// @route   GET /api/teachers
// @desc    Get all teachers for the admin's school
// @access  Private (Admin or Teacher)
router.get('/', [authMiddleware], async (req, res) => {
    try {
        // --- BADLAAV 7: Get 'schoolId' from token ---
        const schoolIdFromToken = req.user.schoolId;

        if (!schoolIdFromToken) {
            return res.status(400).json({ message: "School ID (from Admin token) is required." });
        }
        // --- BADLAAV 8: Query using 'schoolId' ---
        const teachers = await Teacher.find({ schoolId: schoolIdFromToken }).sort({ name: 1 });
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

    // --- BADLAAV 9: Authorize using 'schoolId' ---
    if (teacher.schoolId.toString() !== req.user.schoolId) {
        return res.status(401).json({ msg: 'User not authorized to edit this teacher' });
    }

    const updateData = { ...req.body };
    // --- BADLAAV 10: Prevent updating 'schoolId', email, teacherId ---
    delete updateData.schoolId;
    delete updateData.email;
    delete updateData.teacherId;

    teacher = await Teacher.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });

    // --- BADLAAV 11: Update User model using 'name' field ---
    // Make sure the User model uses 'name' and not 'adminName'
    await User.updateOne({ email: teacher.email }, { $set: { name: teacher.name } });

     // --- BADLAAV 12: Use req.io for real-time updates ---
     if (req.io) {
        req.io.emit('updateDashboard');
        req.io.emit('teacher_updated', teacher);
     } else {
        console.warn('Socket.IO instance not found on request object.');
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

    // --- BADLAAV 13: Authorize using 'schoolId' ---
     if (teacher.schoolId.toString() !== req.user.schoolId) {
        return res.status(401).json({ msg: 'User not authorized to delete this teacher' });
    }

    const deletedTeacherId = req.params.id;
    const teacherEmail = teacher.email;

    // Delete Teacher record first
    await Teacher.findByIdAndDelete(deletedTeacherId);
    // Then delete the associated User account
    await User.findOneAndDelete({ email: teacherEmail });

     // --- BADLAAV 14: Use req.io for real-time updates ---
     if (req.io) {
        req.io.emit('updateDashboard');
        req.io.emit('teacher_deleted', deletedTeacherId);
     } else {
        console.warn('Socket.IO instance not found on request object.');
     }

    res.json({ message: 'Teacher and associated user account removed successfully' });

  } catch (err) {
    console.error("Error deleting teacher:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
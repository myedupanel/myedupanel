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

    // --- FIX 1: Get schoolName from token ---
    const schoolNameFromAdmin = req.user.schoolName;

    // Basic Validation
    if (!teacherId || !name || !subject || !contactNumber || !email) {
      return res.status(400).json({ message: 'Please provide all required teacher details.' });
    }
     if (!schoolNameFromAdmin) {
         return res.status(400).json({ message: 'Admin user details incomplete (missing school info).' });
     }

    // --- FIX 2: Check for duplicate teacher using schoolName ---
    const existingTeacher = await Teacher.findOne({
        schoolName: schoolNameFromAdmin, // Check within the admin's school using schoolName
        $or: [{ email }, { teacherId }]
     });
    if (existingTeacher) {
      return res.status(400).json({ message: 'A teacher with this email or ID already exists in this school.' });
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user account with this email already exists.' });
    }

    // --- FIX 3: REMOVED subject splitting. Save as string. ---
    // const subjectArray = subject.split(',').map(s => s.trim()); // REMOVED

    // Generate password
    const password = generatePassword.generate({ length: 12, numbers: true });

    // Create the User account for the teacher
    const newUser = new User({
      adminName: name,
      schoolName: schoolNameFromAdmin,
      email,
      password,
      role: 'teacher',
    });
    await newUser.save();

    // Create the Teacher record
    const newTeacher = new Teacher({
      teacherId,
      name,
      subject: subject, // --- FIX 3 (continued): Save subject as string ---
      contactNumber,
      email,
      schoolName: schoolNameFromAdmin // --- FIX 1 (continued): Save schoolName ---
    });
    await newTeacher.save();

    // Send welcome email
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
    }

    // Real-time update
    if (req.app.get('socketio')) {
        const io = req.app.get('socketio');
        io.emit('updateDashboard');
        io.emit('teacher_added', newTeacher);
    }

    res.status(201).json({ message: 'Teacher created successfully and welcome email sent.', teacher: newTeacher });

  } catch (err) {
    console.error("Error creating teacher:", err);
    if (err.name === 'ValidationError') {
       const messages = Object.values(err.errors).map(val => val.message);
       return res.status(400).json({ message: messages.join(' ') });
    }
    if (err.code === 11000) {
        // Error from index { teacherId: 1, schoolName: 1 }
        return res.status(400).json({ message: 'A teacher with this ID already exists in this school (Database conflict).' });
    }
    res.status(500).send('Server Error creating teacher');
  }
});

// @route   GET /api/teachers
// @desc    Get all teachers for the admin's school
// @access  Private (Admin or Teacher)
router.get('/', [authMiddleware], async (req, res) => {
    try {
        // --- FIX 4: Use schoolName from token ---
        const schoolNameFromAdmin = req.user.schoolName;

        if (!schoolNameFromAdmin) {
            return res.status(400).json({ message: "School Name (from Admin token) is required." });
        }
        // --- FIX 4 (continued): Query using schoolName ---
        const teachers = await Teacher.find({ schoolName: schoolNameFromAdmin }).sort({ name: 1 });
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

    // --- FIX 5: Check using schoolName ---
    if (teacher.schoolName !== req.user.schoolName) {
        return res.status(401).json({ msg: 'User not authorized to edit this teacher' });
    }

    const updateData = { ...req.body };
    delete updateData.schoolName; // Don't allow changing schoolName
    delete updateData.email;
    delete updateData.teacherId; // Don't allow changing teacherId

    // --- FIX 6: REMOVED subject splitting ---
    // if (updateData.subject && typeof updateData.subject === 'string') {
    //     updateData.subject = updateData.subject.split(',').map(s => s.trim());
    // }

    teacher = await Teacher.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });

    // Update the name in the corresponding User model as well
    await User.updateOne({ email: teacher.email }, { $set: { adminName: teacher.name } });

     // Real-time update
     if (req.app.get('socketio')) {
        const io = req.app.get('socketio');
        io.emit('updateDashboard');
        io.emit('teacher_updated', teacher);
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

    // --- FIX 7: Check using schoolName ---
     if (teacher.schoolName !== req.user.schoolName) {
        return res.status(401).json({ msg: 'User not authorized to delete this teacher' });
    }

    const deletedTeacherId = req.params.id;
    const teacherEmail = teacher.email;

    // Delete Teacher record first
    await Teacher.findByIdAndDelete(deletedTeacherId);
    // Then delete the associated User account
    await User.findOneAndDelete({ email: teacherEmail });

     // Real-time update
     if (req.app.get('socketio')) {
        const io = req.app.get('socketio');
        io.emit('updateDashboard');
        io.emit('teacher_deleted', deletedTeacherId);
    }

    res.json({ message: 'Teacher and associated user account removed successfully' });

  } catch (err) {
    console.error("Error deleting teacher:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
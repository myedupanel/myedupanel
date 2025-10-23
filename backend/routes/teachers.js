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

    // --- BADLAAV 1: Token se 'schoolId' aur 'schoolName' lein ---
    const schoolIdFromToken = req.user.schoolId;
    const schoolNameFromToken = req.user.schoolName; // Email bhejte waqt 'User' banane ke liye

    // Basic Validation
    if (!teacherId || !name || !subject || !contactNumber || !email) {
      return res.status(400).json({ message: 'Please provide all required teacher details.' });
    }
     if (!schoolIdFromToken || !schoolNameFromToken) {
         return res.status(400).json({ message: 'Admin user details incomplete (missing school info).' });
     }

    // --- BADLAAV 2: Duplicate teacher check ke liye 'schoolId' ka istemaal karein ---
    const existingTeacher = await Teacher.findOne({
        schoolId: schoolIdFromToken, // 'schoolName' ke bajaaye 'schoolId' se check karein
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

    // Generate password
    const password = generatePassword.generate({ length: 12, numbers: true });

    // --- BADLAAV 3: Naye 'User' model ke hisaab se User account banayein ---
    const newUser = new User({
      name: name, // 'adminName' ke bajaaye 'name'
      schoolId: schoolIdFromToken, // 'schoolName' ke bajaaye 'schoolId'
      email,
      password,
      role: 'teacher',
    });
    await newUser.save();

    // --- BADLAAV 4: Naye 'Teacher' model ke hisaab se Teacher record banayein ---
    const newTeacher = new Teacher({
      teacherId,
      name,
      subject: subject,
      contactNumber,
      email,
      schoolId: schoolIdFromToken // 'schoolName' ke bajaaye 'schoolId'
    });
    await newTeacher.save();

    // Send welcome email (ismein koi badlaav nahi)
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

    // --- BADLAAV 5: Real-time update ke liye 'req.io' ka istemaal karein ---
    if (req.io) {
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
        // --- BADLAAV 6: Error message ko naye index ke hisaab se update kiya ---
        return res.status(400).json({ message: 'A teacher with this ID or Email already exists (Database conflict).' });
    }
    res.status(500).send('Server Error creating teacher');
  }
});

// @route   GET /api/teachers
// @desc    Get all teachers for the admin's school
// @access  Private (Admin or Teacher)
router.get('/', [authMiddleware], async (req, res) => {
    try {
        // --- BADLAAV 7: Token se 'schoolId' lein ---
        const schoolIdFromToken = req.user.schoolId;

        if (!schoolIdFromToken) {
            return res.status(400).json({ message: "School ID (from Admin token) is required." });
        }
        // --- BADLAAV 8: 'schoolId' ka istemaal karke teachers ko find karein ---
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

    // --- BADLAAV 9: 'schoolId' se authorization check karein ---
    if (teacher.schoolId.toString() !== req.user.schoolId) {
        return res.status(401).json({ msg: 'User not authorized to edit this teacher' });
    }

    const updateData = { ...req.body };
    // --- BADLAAV 10: 'schoolId' ko update hone se rokein ---
    delete updateData.schoolId;
    delete updateData.email;
    delete updateData.teacherId;

    teacher = await Teacher.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });

    // --- BADLAAV 11: 'User' model ko 'name' field se update karein ---
    await User.updateOne({ email: teacher.email }, { $set: { name: teacher.name } }); // 'adminName' ke bajaaye 'name'

     // --- BADLAAV 12: Real-time update ke liye 'req.io' ka istemaal karein ---
     if (req.io) {
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

    // --- BADLAAV 13: 'schoolId' se authorization check karein ---
     if (teacher.schoolId.toString() !== req.user.schoolId) {
        return res.status(401).json({ msg: 'User not authorized to delete this teacher' });
    }

    const deletedTeacherId = req.params.id;
    const teacherEmail = teacher.email;

    // Delete Teacher record first
    await Teacher.findByIdAndDelete(deletedTeacherId);
    // Then delete the associated User account
    await User.findOneAndDelete({ email: teacherEmail });

     // --- BADLAAV 14: Real-time update ke liye 'req.io' ka istemaal karein ---
     if (req.io) {
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
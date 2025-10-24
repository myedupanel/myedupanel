// routes/student.js

const express = require('express');
const router = express.Router();
const Student = require('../models/Student'); // Import Student model
// --- NEW IMPORTS ---
const User = require('../models/User'); // Import User model
const generatePassword = require('generate-password'); // For temporary password
const sendEmail = require('../utils/sendEmail'); // Optional: For sending login details
// --- END NEW IMPORTS ---
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/students
// @desc    Add a new student AND create their User account
// @access  Private (Admin only)
// --- THIS ROUTE IS UPDATED ---
router.post('/', [authMiddleware, authorize('admin')], async (req, res) => {
    try {
        // --- Get student details, including optional email ---
        const { studentId, name, class: studentClass, rollNo, parentName, parentContact, email } = req.body;

        // --- Gets 'schoolId' from token ---
        const schoolIdFromToken = req.user.schoolId;
        if (!schoolIdFromToken) {
            return res.status(400).json({ msg: 'Admin school information is missing. Cannot add student.' });
        }

        // --- Basic Validation ---
        if (!studentId || !name || !studentClass || !rollNo || !parentName || !parentContact) {
            return res.status(400).json({ msg: 'Please provide all required student details (Student ID, Name, Class, Roll No, Parent Name, Parent Contact).' });
        }

        // --- Check duplicate Student (studentId + schoolId) ---
        let existingStudent = await Student.findOne({ studentId, schoolId: schoolIdFromToken });
        if (existingStudent) {
            return res.status(400).json({ msg: 'A student with this ID already exists in your school.' });
        }

        // --- Check duplicate User *if email is provided* ---
        if (email) {
            let existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ msg: 'A user account with this email already exists.' });
            }
        }

        // --- Generate Temporary Password ---
        const password = generatePassword.generate({ length: 10, numbers: true });

        // --- Create the User document ---
        const newUser = new User({
            name: name, // Student's name
            schoolId: schoolIdFromToken,
            email: email || undefined, // Set email if provided, otherwise leave it undefined
            password: password, // Pre-save hook will hash
            role: 'student',
            isVerified: true // Assume admin-created students are verified
        });
        await newUser.save(); // Save the User document first

        // --- Create the Student document ---
        const newStudent = new Student({
            studentId,
            name,
            class: studentClass,
            rollNo,
            parentName,
            parentContact,
            email: email || undefined, // Optionally store email here too
            schoolId: schoolIdFromToken,
            // Optionally link to the User account if needed later
            // userId: newUser._id
        });
        await newStudent.save(); // Save the Student document

        // --- Optional: Send login details email (e.g., to parent contact if no student email) ---
        // Determine recipient email
        const recipientEmail = email || parentContact; // Prioritize student email, fallback to parent contact (assuming it might be an email)
        // Ensure recipientEmail looks like an email before sending
        if (recipientEmail && /.+\@.+\..+/.test(recipientEmail)) {
             try {
                 const subject = 'Your SchoolPro Student Account Details';
                 const message = `
                     <h1>Welcome to SchoolPro, ${name}!</h1>
                     <p>An account has been created for you (or your child).</p>
                     <p>Login details:</p>
                     <ul>
                         <li><strong>Email/Login:</strong> ${email || studentId}</li> {/* Use email if available, otherwise maybe studentId? */}
                         <li><strong>Temporary Password:</strong> ${password}</li>
                     </ul>
                     <p>Please change the password after the first login.</p>
                 `;
                 await sendEmail({ to: recipientEmail, subject, html: message });
                 console.log(`[POST /students] Welcome email sent to ${recipientEmail}`);
             } catch (emailError) {
                 console.error(`[POST /students] Could not send welcome email to ${recipientEmail}:`, emailError);
                 // Don't fail the request if email fails, just log it
             }
        } else {
             console.log(`[POST /students] No valid email provided for student ${name}, skipping welcome email.`);
        }

        // --- Uses 'req.io' for real-time updates ---
        if (req.io) {
            console.log("[POST /students] Emitting socket events...");
            req.io.emit('updateDashboard'); // Trigger dashboard refresh
            req.io.emit('student_added', newStudent); // Send newly created student data
        } else {
            console.warn('[POST /students] Socket.IO instance (req.io) not found on request object.');
        }

        res.status(201).json({ message: 'Student and user account created successfully', student: newStudent });

    } catch (err) {
        // Handle potential duplicate errors from either User (email) or Student (studentId+schoolId)
        if (err.code === 11000) {
            if (err.keyPattern?.email) { // Check if it's the unique email index from User
                return res.status(400).json({ msg: 'A user account with the provided email already exists.' });
            } else { // Assume it's the unique studentId+schoolId index from Student
                return res.status(400).json({ msg: 'A student with this ID already exists in this school (Database conflict).' });
            }
        }
        // Handle validation errors (e.g., missing fields)
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(' ') });
        }
        // Log other errors
        console.error("[POST /students] Error creating student:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/students
// @desc    Get all students for the admin's school
// @access  Private (Admin, Teacher)
// --- NO CHANGES NEEDED BELOW THIS LINE ---
router.get('/', [authMiddleware, authorize('admin', 'teacher')], async (req, res) => {
    try {
        const schoolIdFromToken = req.user.schoolId;
        if (!schoolIdFromToken) return res.status(400).json({ msg: 'School information not found for user.' });
        const students = await Student.find({ schoolId: schoolIdFromToken }).sort({ name: 1 });
        res.json(students);
    } catch (err) { console.error("Error fetching students:", err.message); res.status(500).send('Server Error'); }
});

// @route   GET /api/students/search
// @desc    Search students by name within the admin's school
// @access  Private (Admin, Teacher, Staff)
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const schoolIdFromToken = req.user.schoolId; const studentName = req.query.name || '';
        if (!schoolIdFromToken) return res.status(400).json({ msg: 'School information not found.' });
        if (studentName.length < 2) return res.json([]);
        const students = await Student.find({ schoolId: schoolIdFromToken, name: { $regex: studentName, $options: 'i' } }).limit(10);
        res.json(students);
    } catch (error) { console.error("Error searching students:", error); res.status(500).send("Server Error"); }
});

// @route   GET /api/students/:id
// @desc    Get a single student by their MongoDB ID
// @access  Private (Admin, Teacher, Staff)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ msg: 'Student not found' });
        if (student.schoolId.toString() !== req.user.schoolId) return res.status(403).json({ msg: 'User not authorized to view this student' });
        res.json(student);
    } catch (error) { console.error("Error fetching single student:", error.message); if (error.kind === 'ObjectId') return res.status(404).json({ msg: 'Student not found with that ID format' }); res.status(500).send('Server Error'); }
});

// @route   PUT /api/students/:id
// @desc    Update a student's details
// @access  Private (Admin only)
router.put('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
    try {
        let student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (student.schoolId.toString() !== req.user.schoolId) return res.status(401).json({ msg: 'User not authorized to edit this student' });
        const updateData = { ...req.body };
        delete updateData.schoolId; delete updateData.studentId;
        student = await Student.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        if (req.io) { req.io.emit('updateDashboard'); req.io.emit('student_updated', student); }
        res.json({ message: 'Student details updated successfully', student });
    } catch (err) { console.error("Error updating student:", err.message); res.status(500).send('Server Error'); }
});

// @route   DELETE /api/students/:id
// @desc    Delete a student (AND their User account)
// @access  Private (Admin only)
// --- UPDATED DELETE ROUTE ---
router.delete('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
    try {
        let student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (student.schoolId.toString() !== req.user.schoolId) return res.status(401).json({ msg: 'User not authorized to delete this student' });

        const deletedStudentId = req.params.id;
        const studentEmail = student.email; // Get email stored in Student doc

        // --- Delete the User account first (if email exists) ---
        if (studentEmail) {
            await User.findOneAndDelete({ email: studentEmail, role: 'student' });
            console.log(`[DELETE /students] Deleted user account for email: ${studentEmail}`);
        } else {
            // If no email, maybe find User by studentId if you linked them?
            // For now, assume User might not exist or isn't linked strongly without email.
            console.log(`[DELETE /students] No email associated with student ${deletedStudentId}, skipping User deletion.`);
        }

        // --- Then delete the Student document ---
        await Student.findByIdAndDelete(deletedStudentId);
        console.log(`[DELETE /students] Deleted student document: ${deletedStudentId}`);


        // --- Socket emit ---
        if (req.io) {
            req.io.emit('updateDashboard');
            req.io.emit('student_deleted', deletedStudentId);
        }

        res.json({ message: 'Student removed successfully' });
    } catch (err) {
        console.error("Error deleting student:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});
// --- END UPDATED DELETE ROUTE ---

module.exports = router;
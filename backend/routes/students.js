const express = require('express');
const router = express.Router();
const Student = require('../models/Student'); // Import Student model
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/students
// @desc    Add a new student
// @access  Private (Admin only)
router.post('/', [authMiddleware, authorize('admin')], async (req, res) => {
    try {
        const { studentId, name, class: studentClass, rollNo, parentName, parentContact } = req.body;

        // Get schoolName from the logged-in admin's token
        const schoolNameFromToken = req.user.schoolName;
        if (!schoolNameFromToken) {
            return res.status(400).json({ msg: 'Admin school information is missing. Cannot add student.' });
        }

        // --- FIX 1: Check for duplicates using studentId AND schoolName ---
        let student = await Student.findOne({ studentId, schoolName: schoolNameFromToken });
        if (student) {
            return res.status(400).json({ msg: 'A student with this ID already exists in your school.' });
        }

        // Create a new student instance
        student = new Student({
            ...req.body,
            class: studentClass,
            // --- FIX 2: Save using the correct field name 'schoolName' ---
            schoolName: schoolNameFromToken
        });

        await student.save();

        // Real-time update logic
        if (req.app.get('socketio')) {
            const io = req.app.get('socketio');
            io.emit('updateDashboard');
            io.emit('student_added', student);
        } else {
            console.warn('Socket.IO instance not found on request object.');
        }

        res.status(201).json({ message: 'Student added successfully', student });

    } catch (err) {
        if (err.code === 11000) {
            // Error because of the unique index { studentId: 1, schoolName: 1 }
            return res.status(400).json({ msg: 'A student with this ID already exists in this school (Database conflict).' });
        }
        if (err.name === 'ValidationError') {
            // Catch specific validation errors like missing fields
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(' ') });
        }
        console.error("Error creating student:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/students
// @desc    Get all students for the admin's school
// @access  Private (Admin, Teacher)
router.get('/', [authMiddleware, authorize('admin', 'teacher')], async (req, res) => {
    try {
        const schoolNameFromToken = req.user.schoolName;
        if (!schoolNameFromToken) {
            return res.status(400).json({ msg: 'School information not found for user.' });
        }
        // --- FIX 3: Query using 'schoolName' ---
        const students = await Student.find({ schoolName: schoolNameFromToken }).sort({ name: 1 });
        res.json(students);
    } catch (err) {
        console.error("Error fetching students:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/students/search
// @desc    Search students by name within the admin's school
// @access  Private (Admin, Teacher, Staff)
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const schoolNameFromToken = req.user.schoolName;
        const studentName = req.query.name || '';

        if (!schoolNameFromToken) {
             return res.status(400).json({ msg: 'School information not found.' });
        }
        if (studentName.length < 2) {
            return res.json([]);
        }

        // --- FIX 4: Query using 'schoolName' ---
        const students = await Student.find({
            schoolName: schoolNameFromToken,
            name: { $regex: studentName, $options: 'i' }
        }).limit(10);

        res.json(students);
    } catch (error) {
        console.error("Error searching students:", error);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/students/:id
// @desc    Get a single student by their MongoDB ID
// @access  Private (Admin, Teacher, Staff)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        // --- FIX 5: Check using 'schoolName' ---
        if (student.schoolName !== req.user.schoolName) {
            return res.status(403).json({ msg: 'User not authorized to view this student' });
        }

        res.json(student);
    } catch (error) {
        console.error("Error fetching single student:", error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Student not found with that ID format' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/students/:id
// @desc    Update a student's details
// @access  Private (Admin only)
router.put('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
    try {
        let student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // --- FIX 6: Check using 'schoolName' ---
        if (student.schoolName !== req.user.schoolName) {
            return res.status(401).json({ msg: 'User not authorized to edit this student' });
        }

        const updateData = { ...req.body };
        // Don't allow changing schoolName or studentId via update
        delete updateData.schoolName;
        delete updateData.studentId;

        student = await Student.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });

        // Real-time update
        if (req.app.get('socketio')) {
            const io = req.app.get('socketio');
            io.emit('updateDashboard'); // Dashboard counts might change if student is added/removed elsewhere
            io.emit('student_updated', student);
        }

        res.json({ message: 'Student details updated successfully', student });
    } catch (err) {
        console.error("Error updating student:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/students/:id
// @desc    Delete a student
// @access  Private (Admin only)
router.delete('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
    try {
        let student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // --- FIX 7: Check using 'schoolName' ---
        if (student.schoolName !== req.user.schoolName) {
            return res.status(401).json({ msg: 'User not authorized to delete this student' });
        }

        const deletedStudentId = req.params.id;

        await Student.findByIdAndDelete(deletedStudentId);

        // Real-time update
        if (req.app.get('socketio')) {
            const io = req.app.get('socketio');
            io.emit('updateDashboard');
            io.emit('student_deleted', deletedStudentId);
        }

        res.json({ message: 'Student removed successfully' });
    } catch (err) {
        console.error("Error deleting student:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
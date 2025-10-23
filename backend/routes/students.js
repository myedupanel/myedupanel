// routes/student.js

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

        // --- Gets 'schoolId' from token ---
        const schoolIdFromToken = req.user.schoolId;
        if (!schoolIdFromToken) {
            return res.status(400).json({ msg: 'Admin school information is missing. Cannot add student.' });
        }

        // --- Checks duplicates using 'schoolId' ---
        let student = await Student.findOne({ studentId, schoolId: schoolIdFromToken });
        if (student) {
            return res.status(400).json({ msg: 'A student with this ID already exists in your school.' });
        }

        // Create a new student instance
        student = new Student({
            ...req.body,
            class: studentClass,
            // --- Saves student with 'schoolId' ---
            schoolId: schoolIdFromToken
        });

        await student.save();

        // --- Uses 'req.io' for real-time updates ---
        if (req.io) {
            req.io.emit('updateDashboard');
            req.io.emit('student_added', student);
        } else {
            console.warn('Socket.IO instance (req.io) not found on request object.');
        }

        res.status(201).json({ message: 'Student added successfully', student });

    } catch (err) {
        if (err.code === 11000) {
            // --- Error message updated for the new index ---
            return res.status(400).json({ msg: 'A student with this ID already exists in this school (Database conflict).' });
        }
        if (err.name === 'ValidationError') {
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
        // --- Gets 'schoolId' from token ---
        const schoolIdFromToken = req.user.schoolId;
        if (!schoolIdFromToken) {
            return res.status(400).json({ msg: 'School information not found for user.' });
        }

        // --- Finds students using 'schoolId' ---
        const students = await Student.find({ schoolId: schoolIdFromToken }).sort({ name: 1 });
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
        // --- Gets 'schoolId' from token ---
        const schoolIdFromToken = req.user.schoolId;
        const studentName = req.query.name || '';

        if (!schoolIdFromToken) {
             return res.status(400).json({ msg: 'School information not found.' });
        }
        if (studentName.length < 2) {
            return res.json([]);
        }

        // --- Searches using 'schoolId' ---
        const students = await Student.find({
            schoolId: schoolIdFromToken,
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

        // --- Checks authorization using 'schoolId' ---
        if (student.schoolId.toString() !== req.user.schoolId) {
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

        // --- Checks authorization using 'schoolId' ---
        if (student.schoolId.toString() !== req.user.schoolId) {
            return res.status(401).json({ msg: 'User not authorized to edit this student' });
        }

        const updateData = { ...req.body };

        // --- Prevents updating 'schoolId' ---
        delete updateData.schoolId;
        delete updateData.studentId; // Also prevent changing studentId

        student = await Student.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });

        // --- Uses 'req.io' for real-time updates ---
        if (req.io) {
            req.io.emit('updateDashboard');
            req.io.emit('student_updated', student);
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

        // --- Checks authorization using 'schoolId' ---
        if (student.schoolId.toString() !== req.user.schoolId) {
            return res.status(401).json({ msg: 'User not authorized to delete this student' });
        }

        const deletedStudentId = req.params.id;

        await Student.findByIdAndDelete(deletedStudentId);

        // --- Uses 'req.io' for real-time updates ---
        if (req.io) {
            req.io.emit('updateDashboard');
            req.io.emit('student_deleted', deletedStudentId);
        }

        res.json({ message: 'Student removed successfully' });
    } catch (err) {
        console.error("Error deleting student:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
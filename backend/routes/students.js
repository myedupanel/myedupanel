const express = require('express');
const router = express.Router();
const Student = require('../models/Student'); // Import Student model
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/students
// @desc    Add a new student
// @access  Private (Admin only)
router.post('/', [authMiddleware, authorize('admin')], async (req, res) => {
    try {
        // Extract student details from request body
        const { studentId, name, class: studentClass, rollNo, parentName, parentContact } = req.body;

        // --- FIX 1: Get schoolName from the logged-in admin's token ---
        const schoolName = req.user.schoolName;
        if (!schoolName) {
            // If admin's school name isn't available in token, something is wrong
            return res.status(400).json({ msg: 'Admin school information is missing. Cannot add student.' });
        }

        // --- FIX 2: Check for duplicates using studentId AND schoolName ---
        let student = await Student.findOne({ studentId, schoolName });
        if (student) {
            return res.status(400).json({ msg: 'A student with this ID already exists in your school.' });
        }

        // Create a new student instance
        student = new Student({
            ...req.body, // Include all other fields from the request body
            class: studentClass, // Ensure 'class' field is correctly mapped if needed
            // --- FIX 3: Save schoolName instead of schoolId ---
            schoolName: schoolName
        });

        // Save the student to the database
        await student.save();

        // --- REAL-TIME UPDATE ---
        // Emit an event to update the dashboard (if io is attached)
        if (req.io) {
            req.io.emit('updateDashboard');
        } else {
            console.warn('Socket.IO instance (req.io) not found on request object.');
        }

        // Send success response
        res.status(201).json({ message: 'Student added successfully', student });

    } catch (err) {
        // Handle validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        // Log other errors and send a generic server error response
        console.error("Error creating student:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/students
// @desc    Get all students for the admin's school
// @access  Private (Admin, Teacher)
router.get('/', [authMiddleware, authorize('admin', 'teacher')], async (req, res) => {
    try {
        // --- FIX: Filter by schoolName from the token ---
        const schoolName = req.user.schoolName;
        if (!schoolName) {
            return res.status(400).json({ msg: 'School information not found for user.' });
        }
        // Find students matching the schoolName and sort by name
        const students = await Student.find({ schoolName: schoolName }).sort({ name: 1 });
        res.json(students);
    } catch (err) {
        console.error("Error fetching students:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/students/search
// @desc    Search students by name within the admin's school
// @access  Private (Admin, Teacher, Staff - adjust roles as needed)
router.get('/search', authMiddleware, async (req, res) => {
    try {
        // --- FIX: Filter by schoolName from the token ---
        const schoolName = req.user.schoolName;
        const studentName = req.query.name || ''; // Get search query from URL

        if (!schoolName) {
             return res.status(400).json({ msg: 'School information not found.' });
        }
        // Basic validation for search query length
        if (studentName.length < 2) {
            return res.json([]); // Return empty if query is too short
        }

        // Find students matching schoolName and name (case-insensitive)
        const students = await Student.find({
            schoolName: schoolName,
            name: { $regex: studentName, $options: 'i' } // Assuming 'name' field exists
        }).limit(10); // Limit results for performance

        res.json(students);
    } catch (error) {
        console.error("Error searching students:", error);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/students/:id
// @desc    Get a single student by their MongoDB ID
// @access  Private (Admin, Teacher, Staff - adjust roles as needed)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        // --- FIX: Check if student's school matches the user's school ---
        if (student.schoolName !== req.user.schoolName) {
            // User is trying to access a student from another school
            return res.status(403).json({ msg: 'User not authorized to view this student' });
        }

        res.json(student);
    } catch (error) {
        console.error("Error fetching single student:", error.message);
        // Handle invalid MongoDB ID format
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

        // --- FIX: Verify ownership using schoolName ---
        if (student.schoolName !== req.user.schoolName) {
            return res.status(401).json({ msg: 'User not authorized to edit this student' });
        }

        // Prevent accidental change of schoolName
        const updateData = { ...req.body };
        delete updateData.schoolName; // Remove schoolName if present in update data

        // Find by ID and update with new data
        student = await Student.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });

        // Emit real-time update
        if (req.io) {
            req.io.emit('updateDashboard');
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

        // --- FIX: Verify ownership using schoolName ---
        if (student.schoolName !== req.user.schoolName) {
            return res.status(401).json({ msg: 'User not authorized to delete this student' });
        }

        // Delete the student
        await Student.findByIdAndDelete(req.params.id);

        // Emit real-time update
        if (req.io) {
            req.io.emit('updateDashboard');
        }

        res.json({ message: 'Student removed successfully' });
    } catch (err) {
        console.error("Error deleting student:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; // Export the router
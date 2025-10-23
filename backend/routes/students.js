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

        // --- BADLAAV 1: Token se 'schoolId' lein (pehle 'schoolName' tha) ---
        const schoolIdFromToken = req.user.schoolId;
        if (!schoolIdFromToken) {
            return res.status(400).json({ msg: 'Admin school information is missing. Cannot add student.' });
        }

        // --- BADLAAV 2: Duplicate check ke liye 'schoolId' ka istemaal karein ---
        let student = await Student.findOne({ studentId, schoolId: schoolIdFromToken });
        if (student) {
            return res.status(400).json({ msg: 'A student with this ID already exists in your school.' });
        }

        // Create a new student instance
        student = new Student({
            ...req.body,
            class: studentClass,
            // --- BADLAAV 3: Student ko 'schoolId' ke saath save karein ---
            schoolId: schoolIdFromToken
        });

        await student.save();

        // --- BADLAAV 4: Real-time update ke liye 'req.io' ka istemaal karein ---
        if (req.io) {
            io.emit('updateDashboard');
            io.emit('student_added', student);
        } else {
            console.warn('Socket.IO instance (req.io) not found on request object.');
        }

        res.status(201).json({ message: 'Student added successfully', student });

    } catch (err) {
        if (err.code === 11000) {
            // --- BADLAAV 5: Error message ko naye index ke hisaab se update kiya ---
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
        // --- BADLAAV 6: Token se 'schoolId' lein ---
        const schoolIdFromToken = req.user.schoolId;
        if (!schoolIdFromToken) {
            return res.status(400).json({ msg: 'School information not found for user.' });
        }
        
        // --- BADLAAV 7: 'schoolId' ka istemaal karke students ko find karein ---
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
        // --- BADLAAV 8: Token se 'schoolId' lein ---
        const schoolIdFromToken = req.user.schoolId;
        const studentName = req.query.name || '';

        if (!schoolIdFromToken) {
             return res.status(400).json({ msg: 'School information not found.' });
        }
        if (studentName.length < 2) {
            return res.json([]);
        }

        // --- BADLAAV 9: Search query mein 'schoolId' ka istemaal karein ---
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

        // --- BADLAAV 10: Check karein ki student ka 'schoolId' admin ke 'schoolId' se match karta hai ---
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

        // --- BADLAAV 11: 'schoolId' se authorization check karein ---
        if (student.schoolId.toString() !== req.user.schoolId) {
            return res.status(401).json({ msg: 'User not authorized to edit this student' });
        }

        const updateData = { ...req.body };
        
        // --- BADLAAV 12: 'schoolId' ko update hone se rokein ---
        delete updateData.schoolId;
        delete updateData.studentId; // studentId ko bhi badalne nahi dena chahiye

        student = await Student.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });

        // --- BADLAAV 13: Real-time update ke liye 'req.io' ka istemaal karein ---
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

        // --- BADLAAV 14: 'schoolId' se authorization check karein ---
        if (student.schoolId.toString() !== req.user.schoolId) {
            return res.status(401).json({ msg: 'User not authorized to delete this student' });
        }

        const deletedStudentId = req.params.id;

        await Student.findByIdAndDelete(deletedStudentId);

        // --- BADLAAV 15: Real-time update ke liye 'req.io' ka istemaal karein ---
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
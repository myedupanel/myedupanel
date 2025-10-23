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
        const schoolNameFromToken = req.user.schoolName; // Hum ise 'schoolNameFromToken' ka naam denge
        if (!schoolNameFromToken) {
            return res.status(400).json({ msg: 'Admin school information is missing. Cannot add student.' });
        }

        // --- FIX 2: Check for duplicates using studentId AND schoolId (database key) ---
        let student = await Student.findOne({ studentId, schoolId: schoolNameFromToken });
        if (student) {
            return res.status(400).json({ msg: 'A student with this ID already exists in your school.' });
        }

        // Create a new student instance
        student = new Student({
            ...req.body, // Include all other fields from the request body
            class: studentClass, 
            schoolId: schoolNameFromToken // --- FIX 3: 'schoolName' ki jagah 'schoolId' mein save karein
        });

        // Save the student to the database
        await student.save();

        // --- ✨ REAL-TIME UPDATE (Yeh pehle se sahi tha) ---
        if (req.app.get('socketio')) { // req.io ki jagah req.app.get('socketio') behtar hai
            const io = req.app.get('socketio');
            // Event 1: Dashboard ko refresh karne ke liye
            io.emit('updateDashboard'); 
            
            // Event 2: Student list ko update karne ke liye
            io.emit('student_added', student); 
        } else {
            console.warn('Socket.IO instance not found on request object.');
        }

        // Send success response
        res.status(201).json({ message: 'Student added successfully', student });

    } catch (err) {
        // --- ERROR FIX: Duplicate key error ko aache se handle karein ---
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'A student with this ID already exists in your school (Database conflict).' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
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
        // --- FIX 4: 'schoolName' ki jagah 'schoolId' se find karein ---
        const students = await Student.find({ schoolId: schoolNameFromToken }).sort({ name: 1 });
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
        const schoolNameFromToken = req.user.schoolName;
        const studentName = req.query.name || ''; 

        if (!schoolNameFromToken) {
             return res.status(400).json({ msg: 'School information not found.' });
        }
        if (studentName.length < 2) {
            return res.json([]); 
        }

        // --- FIX 5: 'schoolName' ki jagah 'schoolId' se find karein ---
        const students = await Student.find({
            schoolId: schoolNameFromToken,
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
// @access  Private (Admin, Teacher, Staff - adjust roles as needed)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        // --- FIX 6: 'student.schoolName' ki jagah 'student.schoolId' check karein ---
        if (student.schoolId !== req.user.schoolName) {
            return res.status(403).json({ msg: 'User not authorized to view this student' });
        }

        res.json(student);
    } catch (error) {
        console.error("Error fetching single student:", error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Student not found with that ID format' }); // 404 use karna behtar hai
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

        // --- FIX 7: 'student.schoolName' ki jagah 'student.schoolId' check karein ---
        if (student.schoolId !== req.user.schoolName) {
            return res.status(401).json({ msg: 'User not authorized to edit this student' });
        }

        const updateData = { ...req.body };
        delete updateData.schoolId; // schoolId ko update data se hata dein
        delete updateData.schoolName; // schoolName ko bhi (agar galti se aa gaya ho)

        student = await Student.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });

        // --- ✨ REAL-TIME UPDATE ---
        if (req.app.get('socketio')) {
            const io = req.app.get('socketio');
            io.emit('updateDashboard');
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

        // --- FIX 8: 'student.schoolName' ki jagah 'student.schoolId' check karein ---
        if (student.schoolId !== req.user.schoolName) {
            return res.status(401).json({ msg: 'User not authorized to delete this student' });
        }
        
        const deletedStudentId = req.params.id;

        await Student.findByIdAndDelete(deletedStudentId);

        // --- ✨ REAL-TIME UPDATE ---
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

module.exports = router; // Export the router
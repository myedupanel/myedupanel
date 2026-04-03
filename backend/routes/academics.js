// backend/routes/academics.js
const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
// Academic year middleware import
const { validateAcademicYear } = require('../middleware/academicYearMiddleware');
const prisma = require('../config/prisma'); // Prisma client import karein

// --- GET Routes ---

// GET /api/academics/exams
router.get('/exams', [authMiddleware, validateAcademicYear], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) {
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }
        
        const exams = await prisma.exam.findMany({
            where: { schoolId: schoolId },
            orderBy: { date: 'asc' } // Sort by date ascending
        });
        res.json(exams);
    } catch (err) {
        console.error("Error fetching exams for schedule:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});


// GET /api/academics/assignments
router.get('/assignments', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) {
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }

        const assignments = await prisma.assignment.findMany({
            where: { schoolId: schoolId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(assignments);
    } catch (err) { console.error("Error fetching assignments:", err.message, err.stack); res.status(500).send('Server Error'); }
});

// GET /api/academics/attendance-summary (For Dashboard)
router.get('/attendance-summary', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
         if (!schoolId) {
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        const presentCount = await prisma.attendance.count({
            where: {
                schoolId: schoolId,
                date: { gte: todayStart, lte: todayEnd },
                status: 'Present'
            }
        });
        
        const totalStudents = await prisma.user.count({
            where: {
                schoolId: schoolId,
                role: 'student'
            }
        });

        let percentage = 0;
        if (totalStudents > 0) { percentage = (presentCount / totalStudents) * 100; }
        res.json({ percentage: Math.round(percentage) }); // Round karein
    } catch (err) { console.error("Error fetching attendance summary:", err.message, err.stack); res.status(500).send('Server Error'); }
});

// GET /api/academics/performance (For Dashboard Chart)
router.get('/performance', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) {
            console.log(`[GET /performance] Invalid schoolId: ${schoolId}`);
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }
        console.log(`[GET /performance] Fetching performance for schoolId: ${schoolId}`);
        
        const performanceData = await prisma.mark.groupBy({
            by: ['subject'],
            where: { schoolId: schoolId },
            _avg: {
                percentage: true
            },
            take: 6
        });

        // Data ko format karein jaisa frontend ko chahiye
        const formattedData = performanceData.map(item => ({
            subject: item.subject,
            average: Math.round(item._avg.percentage || 0)
        }));

        console.log(`[GET /performance] Aggregated data:`, formattedData);
        res.json(formattedData);
    } catch (err) { console.error("Error fetching performance data:", err.message, err.stack); res.status(500).send('Server Error'); }
});


// --- CRUD Routes for Exams ---

/**
 * @route   POST /api/academics/exams
 * @desc    Create a new exam
 * @access  Private (Admin Only)
 */
router.post('/exams', [authMiddleware, authorize('Admin')], async (req, res) => { // Role 'Admin' check karein
    const { name, subject, className, date, startTime, endTime, maxMarks, minPassMarks, examType } = req.body;
    const schoolId = req.user.schoolId;

    if (!name || !subject || !className || !date) { return res.status(400).json({ msg: 'Please include name, subject, class, and date.' }); }
    if (!schoolId) { return res.status(400).json({ msg: 'Invalid or missing school ID.' }); }

    try {
        const savedExam = await prisma.exam.create({
            data: {
                name, 
                subject, 
                className, 
                date: new Date(date),
                startTime, 
                endTime, 
                maxMarks: Number(maxMarks), // Number mein convert karein
                minPassMarks: Number(minPassMarks), // Number mein convert karein
                examType, 
                schoolId
            }
        });
        res.status(201).json(savedExam);
    } catch (err) {
        console.error("Error creating exam:", err.message, err.stack);
        if (err.code === 'P2002') { // Prisma validation error
            return res.status(400).json({ msg: 'Validation error.' }); 
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/academics/exams/:id
 * @desc    Update an exam
 * @access  Private (Admin Only)
 */
router.put('/exams/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role 'Admin' check karein
    const { id } = req.params;
    const { name, subject, className, date, startTime, endTime, maxMarks, minPassMarks, examType } = req.body;
    const schoolId = req.user.schoolId;
    const examId = parseInt(id);

    if (isNaN(examId)) { return res.status(400).json({ msg: 'Invalid exam ID format.' }); }
    if (!name || !subject || !className || !date) { return res.status(400).json({ msg: 'Please include name, subject, class, and date.' }); }

    try {
        // Pehle check karein ki exam school ka hai ya nahi
        const exam = await prisma.exam.findFirst({
            where: { id: examId, schoolId: schoolId }
        });
        
        if (!exam) { return res.status(404).json({ msg: 'Exam not found or not authorized.' }); }

        const updatedExam = await prisma.exam.update({
            where: { id: examId },
            data: {
                name, 
                subject, 
                className, 
                date: new Date(date),
                startTime: startTime || exam.startTime,
                endTime: endTime || exam.endTime,
                maxMarks: maxMarks !== undefined ? Number(maxMarks) : exam.maxMarks,
                minPassMarks: minPassMarks !== undefined ? Number(minPassMarks) : exam.minPassMarks,
                examType: examType || exam.examType
            }
        });
        res.json(updatedExam);
    } catch (err) {
        console.error("Error updating exam:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/academics/exams/:id
 * @desc    Delete an exam
 * @access  Private (Admin Only)
 */
router.delete('/exams/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role 'Admin' check karein
    const { id } = req.params;
    const schoolId = req.user.schoolId;
    const examId = parseInt(id);

    if (isNaN(examId)) { return res.status(400).json({ msg: 'Invalid exam ID format.' }); }

    try {
        // Pehle check karein ki exam school ka hai ya nahi
        const exam = await prisma.exam.findFirst({
            where: { id: examId, schoolId: schoolId }
        });
        
        if (!exam) { return res.status(404).json({ msg: 'Exam not found or not authorized.' }); }
        
        await prisma.exam.delete({
            where: { id: examId }
        });
        res.json({ msg: 'Exam removed successfully.' });
    } catch (err) {
        console.error("Error deleting exam:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});


// --- CRUD Routes for Assignments ---

// POST /api/academics/assignments
router.post('/assignments', [authMiddleware, authorize('Admin')], async (req, res) => { // Role 'Admin' check karein
    const { title, classInfo, subject, dueDate, status, classId, studentId } = req.body; // classId, studentId add kiye
    const schoolId = req.user.schoolId;

    if (!title) { return res.status(400).json({ msg: 'Please include title.' }); }
    if (!schoolId) { return res.status(400).json({ msg: 'Invalid or missing school ID.' }); }

    try {
        const savedAssignment = await prisma.assignment.create({
            data: {
                title, 
                classInfo: classInfo || null, // Purana field (agar use ho raha ho)
                subject,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: status || 'Pending', 
                schoolId,
                // Naye relational fields
                classId: classId ? parseInt(classId) : null,
                studentId: studentId ? parseInt(studentId) : null
            }
        });
        res.status(201).json(savedAssignment);
    } catch (err) {
        console.error("Error creating assignment:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

// PUT /api/academics/assignments/:id
router.put('/assignments/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role 'Admin' check karein
    const { id } = req.params;
    const { title, classInfo, subject, dueDate, status, classId, studentId } = req.body;
    const schoolId = req.user.schoolId;
    const assignmentId = parseInt(id);

    if (isNaN(assignmentId)) { return res.status(400).json({ msg: 'Invalid assignment ID format.' }); }
    if (!title) { return res.status(400).json({ msg: 'Please include title.' }); }

    try {
        const assignment = await prisma.assignment.findFirst({
            where: { id: assignmentId, schoolId: schoolId }
        });
        
        if (!assignment) { return res.status(404).json({ msg: 'Assignment not found or not authorized.' }); }

        const updatedAssignment = await prisma.assignment.update({
            where: { id: assignmentId },
            data: {
                title,
                classInfo: classInfo || assignment.classInfo,
                subject: subject !== undefined ? subject : assignment.subject,
                dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : assignment.dueDate,
                status: status !== undefined ? status : assignment.status,
                classId: classId !== undefined ? (classId ? parseInt(classId) : null) : assignment.classId,
                studentId: studentId !== undefined ? (studentId ? parseInt(studentId) : null) : assignment.studentId
            }
        });
        res.json(updatedAssignment);
    } catch (err) {
        console.error("Error updating assignment:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/academics/assignments/:id
router.delete('/assignments/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role 'Admin' check karein
    const { id } = req.params;
    const schoolId = req.user.schoolId;
    const assignmentId = parseInt(id);

    if (isNaN(assignmentId)) { return res.status(400).json({ msg: 'Invalid assignment ID format.' }); }

    try {
        const assignment = await prisma.assignment.findFirst({
            where: { id: assignmentId, schoolId: schoolId }
        });
        
        if (!assignment) { return res.status(404).json({ msg: 'Assignment not found or not authorized.' }); }

        await prisma.assignment.delete({
            where: { id: assignmentId }
        });
        res.json({ msg: 'Assignment removed successfully.' });
    } catch (err) {
        console.error("Error deleting assignment:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

// --- Route for Exam Structure (For Results Page Dropdown) ---

/**
 * @route   GET /api/academics/exam-structure
 * @desc    Get unique exam types and names within them for dropdowns
 * @access  Private
 */
router.get('/exam-structure', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) {
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }

        const exams = await prisma.exam.findMany({
            where: { schoolId: schoolId },
            select: {
                id: true,
                name: true,
                examType: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Data ko manually group karein jaisa Mongoose aggregate kar raha tha
        const structureMap = new Map();
        for (const exam of exams) {
            const type = exam.examType || 'Uncategorized'; // Fallback
            if (!structureMap.has(type)) {
                structureMap.set(type, { type: type, exams: new Set() });
            }
            // Add exam (id and name) to the set
            // Note: Mongoose $addToSet unique banata tha, Set bhi unique banayega
            // Lekin objects ke liye, humein ID se check karna hoga
            const examSet = structureMap.get(type).exams;
            let found = false;
            for (const existing of examSet) {
                if (existing.id === exam.id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                examSet.add({ id: exam.id, name: exam.name });
            }
        }

        // Map ko final array mein convert karein
        const structure = Array.from(structureMap.values()).map(group => ({
            ...group,
            exams: Array.from(group.exams) // Set ko array banayein
        }));

        res.json(structure);

    } catch (err) {
        console.error("Error fetching exam structure:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

module.exports = router; // Ensure this is the last line   
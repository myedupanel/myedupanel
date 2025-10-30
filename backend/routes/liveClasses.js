// backend/routes/liveClasses.js
const express = require('express');
const router = express.Router();
// Mongoose aur LiveClass model hata diye
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma'); // Prisma client import karein

// --- CRUD Routes for Live Classes ---

/**
 * @route   GET /api/live-classes
 * @desc    Get all live classes for the school
 * @access  Private (Admin, Teacher, Student?) - Adjust as needed
 */
router.get('/', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) { // Mongoose ID check hata diya
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }

        // Mongoose find ko Prisma findMany se badla
        const classes = await prisma.liveClass.findMany({
            where: { schoolId: schoolId },
            orderBy: [ // Prisma multiple sort keys support karta hai
                { date: 'asc' },
                { time: 'asc' }
            ]
        });
        res.json(classes);

    } catch (err) {
        console.error("Error fetching live classes:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/live-classes
 * @desc    Schedule a new live class
 * @access  Private (Admin or Teacher) - Adjust as needed
 */
router.post('/', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => { // Roles ko Capitalize kiya
    // Expect: topic, teacherName, className, subject, date, time, meetingLink, status (optional)
    const { topic, teacherName, className, subject, date, time, meetingLink, status } = req.body;
    const schoolId = req.user.schoolId;

    // Validation
    if (!topic || !teacherName || !className || !subject || !date || !time || !meetingLink) {
        return res.status(400).json({ msg: 'Please fill all required fields.' });
    }
     if (!schoolId) { // Mongoose ID check hata diya
        return res.status(400).json({ msg: 'Invalid or missing school ID.' });
    }
    // Simple time format check (yeh theek hai)
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
       return res.status(400).json({ msg: 'Invalid time format. Use HH:MM.' });
    }

    try {
        // new LiveClass().save() ko Prisma create se badla
        const savedClass = await prisma.liveClass.create({
            data: {
                topic,
                teacherName, // Use teacherName from body
                className,
                subject,
                date: new Date(date),
                time, // Store as HH:MM
                meetingLink,
                status: status || 'Scheduled',
                schoolId
            }
        });
        res.status(201).json(savedClass);

    } catch (err) {
        console.error("Error scheduling class:", err.message, err.stack);
        if (err.code === 'P2002') { // Prisma validation/unique error
            return res.status(400).json({ msg: 'Validation error.' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/live-classes/:id
 * @desc    Update a scheduled class
 * @access  Private (Admin or Teacher)
 */
router.put('/:id', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => { // Roles ko Capitalize kiya
    const { id } = req.params;
    const { topic, teacherName, className, subject, date, time, meetingLink, status } = req.body;
    const schoolId = req.user.schoolId;
    const classId = parseInt(id); // ID ko integer mein convert karein

    // Validation
    if (isNaN(classId)) { // Mongoose ID check ko isNaN se badla
        return res.status(400).json({ msg: 'Invalid class ID format.' });
    }
     if (!topic || !teacherName || !className || !subject || !date || !time || !meetingLink) {
        return res.status(400).json({ msg: 'Please fill all required fields.' });
    }
    if (time && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
       return res.status(400).json({ msg: 'Invalid time format. Use HH:MM.' });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla (authorization check ke liye)
        let liveClass = await prisma.liveClass.findFirst({
            where: { id: classId, schoolId: schoolId }
        });

        if (!liveClass) {
            return res.status(404).json({ msg: 'Live class not found or not authorized.' });
        }

        // liveClass.save() ko Prisma update se badla
        const updatedClass = await prisma.liveClass.update({
            where: { id: classId },
            data: {
                topic,
                teacherName,
                className,
                subject,
                date: new Date(date),
                time,
                meetingLink,
                status: status || liveClass.status, // Purani value rakhein agar new nahi hai
            }
        });
        res.json(updatedClass);

    } catch (err) {
        console.error("Error updating class:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/live-classes/:id
 * @desc    Delete a scheduled class
 * @access  Private (Admin or Teacher)
 */
router.delete('/:id', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => { // Roles ko Capitalize kiya
    const { id } = req.params;
    const schoolId = req.user.schoolId;
    const classId = parseInt(id); // ID ko integer mein convert karein

    if (isNaN(classId)) { // Mongoose ID check ko isNaN se badla
        return res.status(400).json({ msg: 'Invalid class ID format.' });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla (authorization check ke liye)
        const liveClass = await prisma.liveClass.findFirst({
            where: { id: classId, schoolId: schoolId }
        });

        if (!liveClass) {
            return res.status(404).json({ msg: 'Live class not found or not authorized.' });
        }

        // Mongoose deleteOne ko Prisma delete se badla
        await prisma.liveClass.delete({
            where: { id: classId }
        });
        res.json({ msg: 'Live class removed successfully.' });

    } catch (err) {
        console.error("Error deleting class:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
// backend/routes/events.js
const express = require('express');
const router = express.Router();
// Mongoose aur Event model hata diye
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma'); // Prisma client import karein

// --- CRUD Routes for Events ---

/**
 * @route   GET /api/events
 * @desc    Get all events for the school
 * @access  Private (Admin, maybe others)
 */
router.get('/', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) { // Mongoose ID check hata diya
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }

        // Mongoose find ko Prisma findMany se badla
        const events = await prisma.event.findMany({
            where: { schoolId: schoolId },
            orderBy: { date: 'asc' } // Sort by date (upcoming first)
        });
        res.json(events);

    } catch (err) {
        console.error("Error fetching events:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private (Admin Only)
 */
router.post('/', [authMiddleware, authorize('Admin')], async (req, res) => { // 'admin' ko 'Admin' kiya
    const { title, category, date, status, description } = req.body;
    const schoolId = req.user.schoolId;

    // Basic Validation
    if (!title || !category || !date) {
        return res.status(400).json({ msg: 'Please include title, category, and date.' });
    }
    if (!schoolId) { // Mongoose ID check hata diya
        return res.status(400).json({ msg: 'Invalid or missing school ID.' });
    }

    try {
        // new Event() aur .save() ko Prisma create se badla
        const savedEvent = await prisma.event.create({
            data: {
                title,
                category,
                date: new Date(date), // Convert string date to Date object
                status: status || 'Upcoming',
                description,
                schoolId
            }
        });
        res.status(201).json(savedEvent); // Send back the created event

    } catch (err) {
        console.error("Error creating event:", err.message, err.stack);
        if (err.code === 'P2002') { // Prisma validation/unique error
            return res.status(400).json({ msg: 'Validation error or duplicate event.' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/events/:id
 * @desc    Update an event
 * @access  Private (Admin Only)
 */
router.put('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // 'admin' ko 'Admin' kiya
    const { id } = req.params;
    const { title, category, date, status, description } = req.body;
    const schoolId = req.user.schoolId;
    const eventId = parseInt(id); // ID ko integer mein convert karein

    // Validate ID and input
    if (isNaN(eventId)) { // Mongoose ID check ko isNaN se badla
        return res.status(400).json({ msg: 'Invalid event ID format.' });
    }
    if (!title || !category || !date) {
        return res.status(400).json({ msg: 'Please include title, category, and date.' });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla (authorization check ke liye)
        const event = await prisma.event.findFirst({
            where: { id: eventId, schoolId: schoolId }
        });

        if (!event) {
            return res.status(404).json({ msg: 'Event not found or not authorized.' });
        }

        // event.save() ko Prisma update se badla
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                title,
                category,
                date: new Date(date), // Convert string date to Date object
                status: status || event.status, // Purani value rakhein agar new nahi hai
                description: description !== undefined ? description : event.description
            }
        });
        res.json(updatedEvent); // Send back the updated event

    } catch (err) {
        console.error("Error updating event:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event
 * @access  Private (Admin Only)
 */
router.delete('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // 'admin' ko 'Admin' kiya
    const { id } = req.params;
    const schoolId = req.user.schoolId;
    const eventId = parseInt(id); // ID ko integer mein convert karein

    if (isNaN(eventId)) { // Mongoose ID check ko isNaN se badla
        return res.status(400).json({ msg: 'Invalid event ID format.' });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla (authorization check ke liye)
        const event = await prisma.event.findFirst({
            where: { id: eventId, schoolId: schoolId }
        });

        if (!event) {
            return res.status(404).json({ msg: 'Event not found or not authorized.' });
        }

        // Mongoose deleteOne ko Prisma delete se badla
        await prisma.event.delete({
            where: { id: eventId }
        });
        res.json({ msg: 'Event removed successfully.' });

    } catch (err) {
        console.error("Error deleting event:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
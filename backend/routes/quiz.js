// backend/routes/quiz.js
const express = require('express');
const router = express.Router();
// Mongoose aur models hata diye
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma'); // Prisma client import karein

// --- CRUD Routes for Quiz Library ---

/**
 * @route   GET /api/quiz/library
 * @desc    Get all quizzes in the school's library
 * @access  Private (Admin)
 */
router.get('/library', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) { // Mongoose ID check hata diya
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }

        // Mongoose find ko Prisma findMany se badla
        const quizzes = await prisma.quiz.findMany({
            where: { schoolId: schoolId },
            orderBy: { createdAt: 'desc' } // Sort by newest first
        });
        res.json(quizzes);

    } catch (err) {
        console.error("Error fetching quiz library:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/quiz/library
 * @desc    Add a new quiz to the library
 * @access  Private (Admin)
 */
router.post('/library', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    // Expect 'title' and 'questions' array in the body
    const { title, questions } = req.body;
    const schoolId = req.user.schoolId;

    // Basic Validation
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ msg: 'Please provide a title and at least one question.' });
    }
    if (!schoolId) { // Mongoose ID check hata diya
        return res.status(400).json({ msg: 'Invalid or missing school ID.' });
    }

    try {
        // new Quiz().save() ko Prisma create se badla
        // Prisma expects Json field to be valid JSON
        const savedQuiz = await prisma.quiz.create({
            data: {
                title,
                questions: questions, // Ensure 'questions' is a valid JSON array/object
                schoolId
            }
        });
        res.status(201).json(savedQuiz); // Send back the created quiz

    } catch (err) {
        console.error("Error creating quiz:", err.message, err.stack);
        if (err.code === 'P2002' || err instanceof prisma.PrismaClientValidationError) { // Prisma validation/unique error
            return res.status(400).json({ msg: 'Validation error or duplicate quiz.' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/quiz/library/:id
 * @desc    Update a quiz in the library
 * @access  Private (Admin)
 */
router.put('/library/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    const { id } = req.params;
    const { title, questions } = req.body;
    const schoolId = req.user.schoolId;
    const quizId = parseInt(id); // ID ko integer mein convert karein

    // Validate ID and input
    if (isNaN(quizId)) { // Mongoose ID check ko isNaN se badla
        return res.status(400).json({ msg: 'Invalid quiz ID format.' });
    }
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ msg: 'Please provide a title and at least one question.' });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla (authorization check ke liye)
        const quiz = await prisma.quiz.findFirst({
            where: { id: quizId, schoolId: schoolId }
        });

        if (!quiz) {
            return res.status(404).json({ msg: 'Quiz not found or not authorized.' });
        }

        // quiz.save() ko Prisma update se badla
        // .markModified ki zaroorat nahi hai
        const updatedQuiz = await prisma.quiz.update({
            where: { id: quizId },
            data: {
                title,
                questions: questions // Ensure 'questions' is valid JSON
            }
        });
        res.json(updatedQuiz); // Send back the updated quiz

    } catch (err) {
        console.error("Error updating quiz:", err.message, err.stack);
         if (err instanceof prisma.PrismaClientValidationError) {
            return res.status(400).json({ msg: 'Validation error.' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/quiz/library/:id
 * @desc    Delete a quiz from the library
 * @access  Private (Admin)
 */
router.delete('/library/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    const { id } = req.params;
    const schoolId = req.user.schoolId;
    const quizId = parseInt(id); // ID ko integer mein convert karein

    if (isNaN(quizId)) { // Mongoose ID check ko isNaN se badla
        return res.status(400).json({ msg: 'Invalid quiz ID format.' });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla (authorization check ke liye)
        const quiz = await prisma.quiz.findFirst({
            where: { id: quizId, schoolId: schoolId }
        });

        if (!quiz) {
            return res.status(404).json({ msg: 'Quiz not found or not authorized.' });
        }

        // School ko update karne ki zaroorat nahi - Schema mein onDelete: SetNull hai
        // const school = await School.findById(schoolId); ... school.save(); <-- YEH HATA DIYA

        // Mongoose deleteOne ko Prisma delete se badla
        await prisma.quiz.delete({
            where: { id: quizId }
        });

        res.json({ msg: 'Quiz removed successfully.' });

    } catch (err) {
        console.error("Error deleting quiz:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});


// --- Routes for Today's Quiz ---

/**
 * @route   GET /api/quiz/today
 * @desc    Get the quiz set for today (for students and admins)
 * @access  Private
 */
router.get('/today', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) { // Mongoose ID check hata diya
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }

        // Mongoose findById().populate() ko Prisma findUnique({ include }) se badla
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                todaysQuiz: true // 'todaysQuiz' relation ko include karein
            }
        });

        if (!school) {
            return res.status(404).json({ msg: 'School not found.' });
        }

        res.json(school.todaysQuiz); // Seedha included quiz object bhejein (ya null agar nahi hai)

    } catch (err) {
        console.error("Error fetching today's quiz:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/quiz/today/:quizId
 * @desc    Set a specific quiz as today's quiz (Admin only)
 * @access  Private (Admin)
 */
router.put('/today/:quizId', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    const { quizId: quizIdParam } = req.params;
    const schoolId = req.user.schoolId;
    const quizId = parseInt(quizIdParam); // ID ko integer mein convert karein

    // Validate IDs
    if (isNaN(quizId)) { // Mongoose ID check ko isNaN se badla
        return res.status(400).json({ msg: 'Invalid Quiz ID format.' });
    }
     if (!schoolId) { // Mongoose ID check hata diya
        return res.status(400).json({ msg: 'Invalid or missing school ID.' });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla
        const quizExists = await prisma.quiz.findFirst({
            where: { id: quizId, schoolId: schoolId }
        });
        if (!quizExists) {
             return res.status(404).json({ msg: 'Quiz not found in your library.' });
        }

        // Mongoose findByIdAndUpdate ko Prisma update se badla
        const updatedSchool = await prisma.school.update({
            where: { id: schoolId },
            data: {
                todaysQuizId: quizId // Seedha ID set karein
            }
        });

        if (!updatedSchool) { // Just in case school delete ho gaya ho
            return res.status(404).json({ msg: 'School not found.' });
        }

        res.json({ msg: `Quiz "${quizExists.title}" set as today's quiz.` , todaysQuizId: updatedSchool.todaysQuizId });

    } catch (err) {
        console.error("Error setting today's quiz:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
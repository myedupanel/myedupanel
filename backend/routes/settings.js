// backend/routes/settings.js
const express = require('express');
const router = express.Router();
// Mongoose aur GradingScale model hata diye
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma'); // Prisma client import karein
const { Prisma } = require('@prisma/client'); // Prisma specific types import karein (JSON default ke liye)

/**
 * @route   GET /api/settings/grading-scale
 * @desc    Get the grading scale for the school
 * @access  Private (Admin)
 */
router.get('/grading-scale', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) { // Mongoose ID check hata diya
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }

        // Mongoose findOne ko Prisma findUnique se badla
        let scaleDoc = await prisma.gradingScale.findUnique({
            where: { schoolId: schoolId }
        });

        if (!scaleDoc) {
            // Agar scale nahi mila, toh default scale ke saath ek naya document banayein
            // Prisma schema mein default value hai, hum use yahaan create karenge agar entry nahi hai
            console.log(`No grading scale found for school ${schoolId}, creating default.`);
            try {
                // Default value Prisma schema se aayegi agar hum data: {} pass karte hain
                scaleDoc = await prisma.gradingScale.create({
                    data: {
                        schoolId: schoolId
                        // 'scale' field automatically gets the default JSON from schema
                    }
                });
            } catch (createError) {
                // Agar create karte waqt error aaye (jaise race condition), dobara fetch karne ki koshish karein
                if (createError.code === 'P2002') { // Unique constraint violation
                    scaleDoc = await prisma.gradingScale.findUnique({ where: { schoolId: schoolId } });
                    if (!scaleDoc) throw createError; // Agar phir bhi nahi mila toh original error throw karein
                } else {
                    throw createError; // Koi aur error ho toh throw karein
                }
            }
        }

        // Frontend ko sirf 'scale' array bhejein (jismein grade rules hain)
        // Prisma JSON ko automatically parse kar deta hai
        res.json(scaleDoc.scale);

    } catch (err) {
        console.error("Error fetching grading scale:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/settings/grading-scale
 * @desc    Update the grading scale for the school
 * @access  Private (Admin)
 */
router.put('/grading-scale', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    const schoolId = req.user.schoolId;
    const newScale = req.body.scale; // Frontend se poora scale array aayega

    // Basic Validation
    if (!schoolId) { // Mongoose ID check hata diya
        return res.status(400).json({ msg: 'Invalid or missing school ID.' });
    }
    if (!Array.isArray(newScale)) {
         return res.status(400).json({ msg: 'Invalid data format. Expected an array.' });
    }
    // TODO: Add more validation for each rule in the array (min/max overlap, etc.)

    try {
        // Mongoose findOneAndUpdate ko Prisma upsert se badla
        // Upsert find karega, agar mila toh update, nahi mila toh create karega
        const updatedScaleDoc = await prisma.gradingScale.upsert({
            where: { schoolId: schoolId }, // Kisko find karna hai
            update: { scale: newScale },   // Agar mile toh kya update karna hai
            create: {                      // Agar na mile toh kya create karna hai
                schoolId: schoolId,
                scale: newScale            // Naya scale yahaan bhi daalein
            }
        });

        res.json(updatedScaleDoc.scale); // Send back the updated scale array

    } catch (err) {
        console.error("Error updating grading scale:", err.message, err.stack);
         if (err instanceof Prisma.PrismaClientValidationError) { // Prisma validation error check
            return res.status(400).json({ msg: 'Validation error. Invalid data for scale.' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
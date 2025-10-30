// backend/routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
// Mongoose aur Models hata diye
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma'); // Prisma client import karein

/*
 * @route   GET /api/school/profile
 * @desc    Get logged-in user's school profile
 * @access  Private
 */
router.get('/profile', [authMiddleware], async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
         console.error("[GET /profile] No schoolId in req.user");
         return res.status(400).json({ msg: 'School ID not found in token' });
    }

    // Mongoose findById ko Prisma findUnique se badla
    const school = await prisma.school.findUnique({
        where: { id: schoolId }
    });

    if (!school) {
      console.error(`[GET /profile] School not found for ID: ${schoolId}`);
      return res.status(404).json({ msg: 'School profile not found for this user' });
    }

    res.json(school);

  } catch (err) {
    console.error("[GET /profile] Error:", err.message);
    // ObjectId error check hata diya
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/school/info
 * @desc    Get basic school info for report cards
 * @access  Private
 */
router.get('/info', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) { // Mongoose ID check hata diya
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }

        // Mongoose findById().select() ko Prisma findUnique({ select }) se badla
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: {
                name: true,
                address: true,
                logo: true, // Original logo field
                session: true
            }
        });

        if (!school) {
            return res.status(404).json({ msg: 'School information not found.' });
        }

        const schoolInfo = {
            name: school.name,
            address: school.address,
            // Logo logic same rakha hai
            logoChar: school.logo || school.name?.charAt(0) || 'S',
            session: school.session || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        };

        res.json(schoolInfo);

    } catch (err) {
        console.error("Error fetching school info:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});


// =======================================================
// === YEH ROUTE UPDATE KIYA GAYA HAI ===
// =======================================================

/*
 * @route   PUT /api/school/profile
 * @desc    Update logged-in user's school profile
 * @access  Private (Admin only)
 */
router.put('/profile', [authMiddleware, authorize('Admin')], async (req, res) => { // Role 'Admin' kiya
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ msg: 'School ID not found in token' });
    }

    // Pehle check karein ki school exist karta hai (findById hata diya)
    const existingSchool = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!existingSchool) {
      return res.status(404).json({ msg: 'School profile not found' });
    }

    // Request body se updated data nikaalein (same as before)
    const {
      name, name2, place, address, contactNumber, email,
      recognitionNumber, udiseNo, logoUrl, session
    } = req.body;

    // Ek object banayein sirf un fields ke saath jo request mein aaye hain
    // Prisma null values ko ignore nahi karta, isliye check karna zaroori hai
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (name2 !== undefined) updateFields.name2 = name2;
    if (place !== undefined) updateFields.place = place;
    if (address !== undefined) updateFields.address = address;
    if (contactNumber !== undefined) updateFields.contactNumber = contactNumber;
    if (email !== undefined) updateFields.email = email;
    if (recognitionNumber !== undefined) updateFields.recognitionNumber = recognitionNumber;
    if (udiseNo !== undefined) updateFields.udiseNo = udiseNo;
    if (logoUrl !== undefined) updateFields.logoUrl = logoUrl;
    if (session !== undefined) updateFields.session = session;

    // Database mein school ko update karein (findByIdAndUpdate ko update se badla)
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: updateFields
    });

    // Socket event (same as before)
    if (req.io) {
       req.io.emit('school_profile_updated', updatedSchool);
    }

    res.json({ msg: 'School profile updated successfully', school: updatedSchool });

  } catch (err) {
    console.error("[PUT /profile] Error:", err.message);

    // Prisma unique constraint error handling (P2002)
    if (err.code === 'P2002' && err.meta?.target?.includes('udiseNo')) {
        return res.status(400).json({ message: `Error: This UDISE No. is already in use by another school.` });
    }
    // Prisma validation error
    if (err instanceof prisma.PrismaClientValidationError) {
         return res.status(400).json({ msg: 'Validation error. Please check your data.' });
    }
    res.status(500).send('Server Error');
  }
});
// =======================================================
// === END UPDATED ROUTE ===
// =======================================================

module.exports = router;
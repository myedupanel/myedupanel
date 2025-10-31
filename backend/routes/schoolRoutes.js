// backend/routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// --- YEH HAI AAPKA FIX (PROBLEM 2) ---
// Hum 'Prisma' library ko import kar rahe hain taaki 'instanceof' error theek ho
const { Prisma } = require('@prisma/client'); 
const prisma = require('../config/prisma'); // Prisma client
// --- FIX ENDS HERE ---

// --- YEH HAI AAPKA FIX (PROBLEM 1) ---
// (Yeh check karein ki yeh dependencies installed hain: npm install multer streamifier)
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('../config/cloudinaryConfig'); // Aapka Cloudinary config
// --- FIX ENDS HERE ---

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 800 * 1024 } // 800KB limit
});

// Cloudinary upload helper
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const cld_upload_stream = cloudinary.uploader.upload_stream(
      { 
        folder: "school_logos", 
        resource_type: "image"
      },
      (error, result) => {
        if (result) {
          resolve(result.secure_url); 
        } else {
          reject(error); 
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(cld_upload_stream);
  });
};


/*
 * @route   GET /api/school/profile
 * (Is route mein koi badlaav nahi)
 */
router.get('/profile', [authMiddleware], async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
         console.error("[GET /profile] No schoolId in req.user");
         return res.status(400).json({ msg: 'School ID not found in token' });
    }
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
    res.status(500).send('Server Error');
  }
});

/*
 * @route   GET /api/school/info
 * (Is route mein koi badlaav nahi)
 */
router.get('/info', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) { 
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: {
                name: true,
                address: true,
                logo: true, 
                session: true
            }
        });
        if (!school) {
            return res.status(404).json({ msg: 'School information not found.' });
        }
        const schoolInfo = {
            name: school.name,
            address: school.address,
            logoChar: school.logo || school.name?.charAt(0) || 'S',
            session: school.session || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        };
        res.json(schoolInfo);
    } catch (err) {
        console.error("Error fetching school info:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});


/*
 * @route   PUT /api/school/profile
 * (Yeh route pehle se hi file upload ke liye sahi hai)
 */
router.put('/profile', [authMiddleware, authorize('Admin'), upload.single('logo')], async (req, res) => {
  console.log("[PUT /profile] Request received (multipart/form-data).");
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ msg: 'School ID not found in token' });
    }

    const existingSchool = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!existingSchool) {
      return res.status(404).json({ msg: 'School profile not found' });
    }

    // Yeh line (137) ab fail nahi honi chahiye (agar multer installed hai)
    const {
      name, name2, place, address, contactNumber, email,
      recognitionNumber, udiseNo, session
    } = req.body; 

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (name2 !== undefined) updateFields.name2 = name2;
    if (place !== undefined) updateFields.place = place;
    if (address !== undefined) updateFields.address = address;
    if (contactNumber !== undefined) updateFields.contactNumber = contactNumber;
    if (email !== undefined) updateFields.email = email;
    if (recognitionNumber !== undefined) updateFields.recognitionNumber = recognitionNumber;
    if (udiseNo !== undefined) updateFields.udiseNo = udiseNo;
    if (session !== undefined) updateFields.session = session;

    if (req.file) {
      console.log("[PUT /profile] New logo file detected. Uploading to Cloudinary...");
      try {
        const imageUrl = await uploadToCloudinary(req.file.buffer);
        updateFields.logoUrl = imageUrl; 
        console.log(`[PUT /profile] Upload successful. URL: ${imageUrl}`);
      } catch (uploadError) {
        console.error("[PUT /profile] Cloudinary upload failed:", uploadError);
      }
    } else {
      console.log("[PUT /profile] No new logo file detected.");
    }

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: updateFields
    });

    if (req.io) {
       req.io.emit('school_profile_updated', updatedSchool);
    }

    res.json({ msg: 'School profile updated successfully', school: updatedSchool });

  } catch (err) {
    console.error("[PUT /profile] Error:", err);

    // --- YEH HAI AAPKA FIX (PROBLEM 2) ---
    // 'prisma.PrismaClientValidationError' ko 'Prisma.PrismaClientValidationError' kiya
    if (err instanceof Prisma.PrismaClientValidationError) {
         return res.status(400).json({ msg: 'Validation error. Please check your data.' });
    }
    // --- FIX ENDS HERE ---

    if (err.code === 'P2002' && err.meta?.target?.includes('udiseNo')) {
        return res.status(400).json({ message: `Error: This UDISE No. is already in use.` });
    }
    
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
         return res.status(413).json({ message: 'File is too large. Max 800KB allowed.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
// backend/routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma'); // Prisma client

// --- NAYA KADAM 1: File upload ke liye dependencies import karein ---
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('../config/cloudinaryConfig'); // Aapka Cloudinary config (jisse 'api_key' milti hai)

// --- NAYA KADAM 2: Multer ko setup karein ---
// Hum file ko disk par save nahi karenge, memory mein rakhenge
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 800 * 1024 } // 800KB limit (jo aapne request ki thi)
});

// --- NAYA KADAM 3: Cloudinary upload ke liye helper function ---
// Yeh function ek file buffer lega aur use Cloudinary par upload karke URL dega
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    // Cloudinary uploader ko ek stream chahiye
    const cld_upload_stream = cloudinary.uploader.upload_stream(
      { 
        folder: "school_logos", // Cloudinary mein 'school_logos' naam ka folder ban jayega
        resource_type: "image"
      },
      (error, result) => {
        if (result) {
          resolve(result.secure_url); // Upload successful, naya URL return karein
        } else {
          reject(error); // Upload fail
        }
      }
    );
    // File buffer ko stream mein convert karke Cloudinary ko pipe karein
    streamifier.createReadStream(fileBuffer).pipe(cld_upload_stream);
  });
};


/*
 * @route   GET /api/school/profile
 * @desc    Get logged-in user's school profile
 * @access  Private
 */
// (Is route mein koi badlaav nahi)
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

/**
 * @route   GET /api/school/info
 * @desc    Get basic school info for report cards
 * @access  Private
 */
// (Is route mein koi badlaav nahi)
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


// =======================================================
// === YEH ROUTE POORI TARAH UPDATE KIYA GAYA HAI ===
// =======================================================

/*
 * @route   PUT /api/school/profile
 * @desc    Update logged-in user's school profile (with file upload)
 * @access  Private (Admin only)
 */
// --- NAYA KADAM 4: 'upload.single('logo')' middleware ko add karein ---
// 'logo' wahi key hai jo humne frontend 'FormData' mein (data.append('logo', ...)) set ki thi
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

    // --- NAYA KADAM 5: Text data ko 'req.body' se lein ---
    // (Multer 'FormData' se text fields ko 'req.body' mein daal deta hai)
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

    // --- NAYA KADAM 6: File ko 'req.file' se lein aur upload karein ---
    // (Multer file ko 'req.file' mein daalta hai)
    if (req.file) {
      console.log("[PUT /profile] New logo file detected. Uploading to Cloudinary...");
      try {
        const imageUrl = await uploadToCloudinary(req.file.buffer);
        updateFields.logoUrl = imageUrl; // Database mein naya URL save karein
        console.log(`[PUT /profile] Upload successful. URL: ${imageUrl}`);
      } catch (uploadError) {
        console.error("[PUT /profile] Cloudinary upload failed:", uploadError);
        // Agar upload fail ho toh bhi profile update hone dein (bina logo ke)
        // Ya aap yahaan error bhej sakte hain:
        // return res.status(500).json({ msg: 'Image upload failed.' });
      }
    } else {
      console.log("[PUT /profile] No new logo file detected.");
      // Agar user ne nayi image nahi di, toh hum 'logoUrl' ko nahi chhedenge
      // (frontend se 'logoUrl' text field ab aa hi nahi raha hai)
    }

    // --- NAYA KADAM 7: Database ko update karein ---
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: updateFields
    });

    if (req.io) {
       req.io.emit('school_profile_updated', updatedSchool);
    }

    // Frontend ko naya data (aur token agar zaroori ho) bhejein
    // (Humne token logic ko 'admin.js' mein move kar diya hai, yahaan seedha response bhej sakte hain)
    res.json({ msg: 'School profile updated successfully', school: updatedSchool });

  } catch (err) {
    console.error("[PUT /profile] Error:", err);

    if (err.code === 'P2002' && err.meta?.target?.includes('udiseNo')) {
        return res.status(400).json({ message: `Error: This UDISE No. is already in use.` });
    }
    if (err instanceof prisma.PrismaClientValidationError) {
         return res.status(400).json({ msg: 'Validation error. Please check your data.' });
    }
    // Multer error (File too large)
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
         return res.status(413).json({ message: 'File is too large. Max 800KB allowed.' });
    }
    res.status(500).send('Server Error');
  }
});
// =======================================================
// === END UPDATED ROUTE ===
// =======================================================

module.exports = router;
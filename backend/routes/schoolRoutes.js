const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { Prisma } = require('@prisma/client'); 
const prisma = require('../config/prisma'); 

// --- Multer/Cloudinary Imports ---
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('../config/cloudinaryConfig'); // Aapka Cloudinary config

// --- Multer setup ---
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    // --- FIX 1: Limit ko 2MB kar diya hai ---
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Cloudinary upload helper (No Change)
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
 * (No change)
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
 * (No change)
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
 * (Yeh route ab fully updated hai)
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

    // --- FIX 2: 'genRegNo' ko req.body se nikaal rahe hain ---
    // (Yeh line 128 thi, ab yeh 'genRegNo' ko bhi include karegi)
    const {
      name, name2, place, address, contactNumber, email,
      recognitionNumber, udiseNo, session, genRegNo 
    } = req.body; 

    // Ab 'req.body' undefined nahi hona chahiye kyunki 'multer' isse parse kar raha hai
    if (name === undefined) {
        // Agar 'name' undefined hai, iska matlab 'multer' ne body ko parse nahi kiya
        console.error("[PUT /profile] Error: req.body is not being populated by multer.");
        return res.status(500).json({ msg: 'Server error: Failed to parse form data.' });
    }

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
    // --- FIX 2: 'genRegNo' ko update query mein add kar rahe hain ---
    if (genRegNo !== undefined) updateFields.genRegNo = genRegNo;


    if (req.file) {
      console.log("[PUT /profile] New logo file detected. Uploading to Cloudinary...");
      try {
        const imageUrl = await uploadToCloudinary(req.file.buffer);
        updateFields.logoUrl = imageUrl; 
        console.log(`[PUT /profile] Upload successful. URL: ${imageUrl}`);
      } catch (uploadError) {
        console.error("[PUT /profile] Cloudinary upload failed:", uploadError);
        // Hum fail hone par bhi profile update jaari rakhenge, logo ke bina
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

    // Naye token ki zaroorat nahi hai jab tak hum 'name' context mein update na karein
    // (Lekin humne 'name' update kiya hai, isliye token bhejte hain)
    // NOTE: Aapko frontend par new token handle karna hoga (jo aapka code pehle se kar raha hai)
    
    // --- Yahan hum naya token generate kar sakte hain agar zaroori ho ---
    // (Abhi ke liye, hum sirf profile update kar rahe hain)
    
    res.json({ msg: 'School profile updated successfully', school: updatedSchool });

  } catch (err) {
    console.error("[PUT /profile] Error:", err);

    if (err instanceof Prisma.PrismaClientValidationError) {
         return res.status(400).json({ msg: 'Validation error. Please check your data.' });
    }

    if (err.code === 'P2002' && err.meta?.target?.includes('udiseNo')) {
        return res.status(400).json({ message: `Error: This UDISE No. is already in use.` });
    }
    
    // --- FIX 1: Error message ko 2MB ke hisaab se update kiya ---
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
         return res.status(413).json({ message: 'File is too large. Max 2MB allowed.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
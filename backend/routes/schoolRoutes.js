// backend/routes/schoolRoutes.js (SUPREME SECURE with Sanitization)

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
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// === FIX 1: THE SANITIZER FUNCTION (XSS Prevention) ===
// यह फ़ंक्शन किसी भी स्ट्रिंग से सभी HTML टैग्स को हटा देगा।
function removeHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '').trim(); 
}
// === END FIX 1 ===


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
          // Error ko reject karein taaki catch block use pakad sake
          reject(error); 
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(cld_upload_stream);
  });
};


/*
 * @route   GET /api/school/profile (No Change in Logic)
 * NOTE: Isme Sanitization ki zaroorat nahi, kyunki yeh sirf data fetch karta hai.
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
 * @route   GET /api/school/info (No Change in Logic)
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
 * @route   PUT /api/school/profile (Sanitization Applied)
 * NOTE: Multer body ko populate karta hai, isliye req.body mein data text ke roop mein aata hai.
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

    // req.body se text fields nikaalein
    const {
      name, name2, place, address, contactNumber, email,
      recognitionNumber, udiseNo, session, genRegNo 
    } = req.body; 

    if (name === undefined) {
        // Multer error ko handle karein
        return res.status(500).json({ msg: 'Server error: Failed to parse form data.' });
    }

    // === FIX 2: INPUT SANITIZATION for every text field ===
    const sanitizedData = {};
    for (const key in req.body) {
        sanitizedData[key] = removeHtmlTags(req.body[key]);
    }
    // === END FIX 2 ===

    const updateFields = {};
    if (sanitizedData.name !== undefined) updateFields.name = sanitizedData.name;
    if (sanitizedData.name2 !== undefined) updateFields.name2 = sanitizedData.name2;
    if (sanitizedData.place !== undefined) updateFields.place = sanitizedData.place;
    if (sanitizedData.address !== undefined) updateFields.address = sanitizedData.address;
    if (sanitizedData.contactNumber !== undefined) updateFields.contactNumber = sanitizedData.contactNumber;
    
    // Email ko sanitize karne ke baad lowercase karein
    if (sanitizedData.email !== undefined) updateFields.email = sanitizedData.email.toLowerCase();
    
    if (sanitizedData.recognitionNumber !== undefined) updateFields.recognitionNumber = sanitizedData.recognitionNumber;
    if (sanitizedData.udiseNo !== undefined) updateFields.udiseNo = sanitizedData.udiseNo;
    if (sanitizedData.session !== undefined) updateFields.session = sanitizedData.session;
    if (sanitizedData.genRegNo !== undefined) updateFields.genRegNo = sanitizedData.genRegNo;

    // --- YAHAN FIX KIYA GAYA HAI (Logo Upload) ---
    if (req.file) {
      console.log("[PUT /profile] New logo file detected. Uploading to Cloudinary...");
      try {
        const imageUrl = await uploadToCloudinary(req.file.buffer);
        
        updateFields.logoUrl = imageUrl; 
        updateFields.logo = imageUrl;    

        console.log(`[PUT /profile] Upload successful. URL: ${imageUrl}`);
      } catch (uploadError) {
        console.error("[PUT /profile] Cloudinary upload failed:", uploadError);
        
        return res.status(500).json({ message: 'Logo upload failed. Profile text saved, but please check Cloudinary credentials.' });
      }
    } 
    // --- FIX ENDS HERE ---

    // Remove undefined/null values to prevent Prisma error
    Object.keys(updateFields).forEach(key => (updateFields[key] === undefined || updateFields[key] === null) && delete updateFields[key]);


    if (Object.keys(updateFields).length === 0) {
         return res.status(400).json({ message: 'No valid fields provided for update.' });
    }


    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: updateFields
    });

    if (req.io) {
       req.io.emit('school_profile_updated', updatedSchool);
    }
    
    // NOTE: Token update logic yahaan se hata diya gaya hai, use Admin route (admin.js) mein rakhein.
    
    res.json({ msg: 'School profile updated successfully', school: updatedSchool });

  } catch (err) {
    console.error("[PUT /profile] Error:", err);

    if (err instanceof Prisma.PrismaClientValidationError) {
         return res.status(400).json({ msg: 'Validation error. Please check your data.' });
    }

    if (err.code === 'P2002' && err.meta?.target?.includes('udiseNo')) {
        return res.status(400).json({ message: `Error: This UDISE No. is already in use.` });
    }
    
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
         return res.status(413).json({ message: 'File is too large. Max 2MB allowed.' });
    }
    res.status(500).send('Server Error');
  }
});


// @route PUT /api/school/profile/logo-url (Logo URL update ko alag function mein rakhein)
router.put('/profile/logo-url', [authMiddleware, authorize('Admin')], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const logoUrl = removeHtmlTags(req.body.logoUrl); 

        if (!logoUrl) {
            return res.status(400).json({ message: 'Logo URL is required.' });
        }

        const updatedSchool = await prisma.school.update({
            where: { id: schoolId },
            data: { logoUrl: logoUrl, logo: logoUrl },
        });

        if (req.io) {
            req.io.emit('school_profile_updated', updatedSchool);
        }

        res.status(200).json({ 
            message: 'School logo updated successfully.',
            school: updatedSchool
        });

    } catch (error) {
        console.error("Error updating school logo URL:", error);
        res.status(500).json({ message: 'Server error updating school logo URL.' });
    }
});


module.exports = router;
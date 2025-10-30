// backend/routes/studyMaterial.js
const express = require('express');
const router = express.Router();
// Mongoose aur StudyMaterial model hata diye
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma'); // Prisma client import karein
const { upload, cloudinary } = require('../config/cloudinaryConfig'); // Cloudinary config same rahega
const { Prisma } = require('@prisma/client'); // Prisma types for error handling

// --- Routes for Study Material ---

/**
 * @route   GET /api/study-material
 * @desc    Get all study materials for the school (can add filters later)
 * @access  Private
 */
router.get('/', [authMiddleware], async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) { // Mongoose ID check hata diya
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }

        // Mongoose find ko Prisma findMany se badla
        const materials = await prisma.studyMaterial.findMany({
            where: { schoolId: schoolId },
            orderBy: { createdAt: 'desc' } // Sort by upload date
        });
        res.json(materials);

    } catch (err) {
        console.error("Error fetching study materials:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/study-material/upload
 * @desc    Upload a new study material (metadata + file)
 * @access  Private (Admin or Teacher)
 */
// Use multer middleware 'upload.single("materialFile")'
router.post('/upload', [authMiddleware, authorize('Admin', 'Teacher'), upload.single('materialFile')], async (req, res) => { // Roles updated
    const { title, className, subject, category } = req.body;
    const schoolId = req.user.schoolId;

    // Validation
    if (!req.file) { // Check if file was uploaded
        return res.status(400).json({ msg: 'No file uploaded.' });
    }
     if (!title || !className || !subject || !category) {
        // Agar file upload ho gayi hai par metadata missing hai, toh file delete karein
         // Cloudinary filename ya publicid req.file se milta hai
         const publicId = req.file.filename || req.file.publicid; // Check both possibilities
         if (publicId) {
             await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }); // Assuming raw for non-images
         }
        return res.status(400).json({ msg: 'Please provide title, class, subject, and category.' });
    }
     if (!schoolId) { // Mongoose ID check hata diya
          const publicId = req.file.filename || req.file.publicid;
          if (publicId) {
              await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
          }
        return res.status(400).json({ msg: 'Invalid or missing school ID.' });
    }

    // Determine fileType (yeh logic same rahega)
    let fileType = 'Other';
    const extension = req.file.originalname.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') fileType = 'PDF';
    else if (extension === 'doc' || extension === 'docx') fileType = 'Word';
    // Add more types if needed (e.g., 'Image' for jpg/png)

    // Cloudinary se publicid extract karein (delete ke liye zaroori)
    const cloudinaryPublicId = req.file.filename || req.file.publicid;

    try {
        // new StudyMaterial().save() ko Prisma create se badla
        const savedMaterial = await prisma.studyMaterial.create({
            data: {
                title,
                className,
                subject,
                category,
                fileUrl: req.file.path, // URL from Cloudinary
                fileType: fileType,
                originalFilename: req.file.originalname,
                schoolId
            }
        });
        res.status(201).json(savedMaterial);

    } catch (err) {
        // Agar DB save fail ho, toh Cloudinary se file delete karein
        if (cloudinaryPublicId) {
            await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'raw' });
        }
        console.error("Error saving study material:", err.message, err.stack);
        if (err instanceof Prisma.PrismaClientValidationError) { // Prisma validation error
            return res.status(400).json({ msg: 'Invalid data provided.' });
        }
        res.status(500).send('Server Error');
    }
});


/**
 * @route   PUT /api/study-material/:id
 * @desc    Update study material metadata (NOT the file)
 * @access  Private (Admin or Teacher)
 */
router.put('/:id', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => { // Roles updated
    const { id } = req.params;
    // Only allow updating metadata
    const { title, className, subject, category } = req.body;
    const schoolId = req.user.schoolId;
    const materialId = parseInt(id); // ID ko integer mein convert karein

    if (isNaN(materialId)) { // Mongoose ID check ko isNaN se badla
        return res.status(400).json({ msg: 'Invalid material ID format.' });
    }
    if (!title || !className || !subject || !category) {
         return res.status(400).json({ msg: 'Please provide title, class, subject, and category.' });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla (authorization check ke liye)
        let material = await prisma.studyMaterial.findFirst({
            where: { id: materialId, schoolId: schoolId }
        });
        if (!material) {
            return res.status(404).json({ msg: 'Material not found or not authorized.' });
        }

        // material.save() ko Prisma update se badla
        const updatedMaterial = await prisma.studyMaterial.update({
            where: { id: materialId },
            data: {
                title,
                className,
                subject,
                category
            }
        });
        res.json(updatedMaterial);

    } catch (err) {
        console.error("Error updating study material:", err.message, err.stack);
        if (err instanceof Prisma.PrismaClientValidationError) {
             return res.status(400).json({ msg: 'Invalid data provided.' });
        }
        res.status(500).send('Server Error');
    }
});


/**
 * @route   DELETE /api/study-material/:id
 * @desc    Delete study material (metadata and file)
 * @access  Private (Admin or Teacher)
 */
router.delete('/:id', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => { // Roles updated
    const { id } = req.params;
    const schoolId = req.user.schoolId;
    const materialId = parseInt(id); // ID ko integer mein convert karein

     if (isNaN(materialId)) { // Mongoose ID check ko isNaN se badla
        return res.status(400).json({ msg: 'Invalid material ID format.' });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla
        const material = await prisma.studyMaterial.findFirst({
            where: { id: materialId, schoolId: schoolId }
        });
        if (!material) {
            return res.status(404).json({ msg: 'Material not found or not authorized.' });
        }

        // --- Delete file from Cloudinary (yeh logic same rahega) ---
        const urlParts = material.fileUrl.split('/');
        // Cloudinary publicid mein folder path bhi include hota hai
        // Find karein 'upload/' ke baad wala hissa
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        let publicIdWithVersionAndExtension = '';
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) { // Check karein ki version aur filename hai
             // Version ko skip karke baaki join karein
             publicIdWithVersionAndExtension = urlParts.slice(uploadIndex + 2).join('/');
        } else {
             // Agar structure alag hai, toh fallback try karein (jaise aapka purana code)
             const materialsIndex = urlParts.indexOf('study_materials');
             if(materialsIndex !== -1) {
                 publicIdWithVersionAndExtension = urlParts.slice(materialsIndex).join('/');
             }
        }

        // Extension hatayein
        const publicId = publicIdWithVersionAndExtension.substring(0, publicIdWithVersionAndExtension.lastIndexOf('.')) || publicIdWithVersionAndExtension;


        if (publicId) {
             console.log(`Deleting from Cloudinary: ${publicId}`);
             await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }); // resource_type 'raw' rakhein non-images ke liye
        } else {
             console.warn(`Could not extract publicid from URL: ${material.fileUrl}`);
             // Proceed to delete DB record anyway? Ya error dein? Abhi proceed karte hain.
        }
        // --- End Cloudinary Delete ---


        // Mongoose deleteOne ko Prisma delete se badla
        await prisma.studyMaterial.delete({
            where: { id: materialId }
        });

        res.json({ msg: 'Study material removed successfully.' });

    } catch (err) {
        console.error("Error deleting study material:", err.message, err.stack);
         if (err.code === 'P2025') { // Prisma record not found error on delete
             return res.status(404).json({ msg: 'Material not found during delete.' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
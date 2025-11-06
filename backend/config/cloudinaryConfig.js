const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config(); // Ensure dotenv is configured to load .env variables

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // === YAHAN FIX KIYA (1/2) ===
    folder: 'school_logos', // 'study_materials' se 'school_logos' kiya
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // PDF/DOC hata diye
    
    // === YAHAN FIX KIYA (2/2) ===
    // 'raw' ko 'image' (ya 'auto') se badal diya
    // 'auto' best hai, yeh file type khud detect kar lega
    resource_type: 'auto', 
  },
});

// Create the multer upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // Limit 2MB rakha (aapke frontend se match)
});

// Export the upload middleware and configured cloudinary instance
module.exports = { upload, cloudinary };
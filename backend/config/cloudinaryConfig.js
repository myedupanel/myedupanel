// backend/config/cloudinaryConfig.js

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
    folder: 'study_materials', // Cloudinary mein folder ka naam jahaan files save hongi
    allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg'], // Allowed file types (aap aur add kar sakte hain)
    resource_type: 'raw', // Use 'raw' for non-image files like PDF/DOCX, 'auto' might also work
    // publicid: (req, file) => 'computed-filename-using-request', // Optional: Agar custom filename chahiye
  },
});

// Create the multer upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Optional: Limit file size to 10MB
});

// Export the upload middleware and configured cloudinary instance
module.exports = { upload, cloudinary };
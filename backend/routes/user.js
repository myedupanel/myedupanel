// backend/routes/user.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware'); // authMiddleware import karein

// User controller se updated functions import karein
const {
    getUserProfile,       // '/me' route ke liye
    updateUserProfile,    // '/profile' PUT route ke liye
    updateUserPassword    // '/password' PUT route ke liye
    // updateSchoolName function shayad ab alag se zaroori nahi hai agar profile update mein handle ho raha hai
    // Agar alag se chahiye toh usse bhi import karein
} = require('../controllers/userController');

// @route   GET /api/users/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authMiddleware, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update current user's profile (name, maybe email)
// @access  Private
router.put('/profile', authMiddleware, updateUserProfile);

// @route   PUT /api/users/password
// @desc    Update current user's password
// @access  Private
router.put('/password', authMiddleware, updateUserPassword);

// Note: School name update logic admin ke profile update (admin.js route) mein handle ho raha tha.
// Agar aapko /api/users/school-name route ki zaroorat hai, toh uske liye controller function banakar yahaan add kar sakte hain.
// router.put('/school-name', authMiddleware, updateSchoolName); // Agar yeh function alag se implement kiya hai

module.exports = router;
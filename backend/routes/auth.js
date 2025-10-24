// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const School = require('../models/School'); // School model imported
const sendEmail = require('../utils/sendEmail');
const { authMiddleware } = require('../middleware/authMiddleware');

// ===== UPDATED SIGNUP ROUTE =====
router.post('/signup', async (req, res) => {
  // --- FIX 1: Expect 'adminName' from the request body ---
  const { schoolName, adminName, email, password } = req.body;
  // TODO: Add location data from frontend

  try {
    // Step 1: Check for existing verified user
    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ message: 'A user with this email is already registered.' });
    }

    // Step 2: Check for existing school
    let school = await School.findOne({ name: schoolName });

    let schoolIdToUse;

    if (school) {
      // School exists
      // Check if it's the same unverified user trying again for the same school
      if (user && user.isVerified === false && user.schoolId && user.schoolId.toString() === school._id.toString()) { // Added check for user.schoolId
        schoolIdToUse = school._id;
      } else {
        // New user trying an existing school name, or verified user trying again. BLOCK.
        return res.status(400).json({ message: 'This school name is already registered.' });
      }
    } else {
      // New school
      if (user && user.schoolId) {
        // Unverified user changing school name? Delete old placeholder school.
        await School.findByIdAndDelete(user.schoolId);
      }

      // Create new school
      const newSchool = new School({
        name: schoolName,
        // Placeholder location
        location: {
          city: 'Not Set',
          state: 'Not Set',
          country: 'Not Set'
        }
      });
      await newSchool.save(); // Fails if name is duplicate
      schoolIdToUse = newSchool._id;
    }

    // Step 3: Create or Update User with schoolId
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000);

    if (user) {
      // Update existing unverified user
      user.password = password; // Pre-save hook hashes
      // --- FIX 2: Save received 'adminName' into DB 'name' field ---
      user.name = adminName;
      user.schoolId = schoolIdToUse;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // Create new user
      user = new User({
        schoolId: schoolIdToUse,
         // --- FIX 3: Save received 'adminName' into DB 'name' field ---
        name: adminName,
        email,
        password, // Pre-save hook hashes
        otp,
        otpExpires,
        role: 'admin' // Set role for new user
      });
      await user.save();
    }

    // Step 4: Send OTP email
    try {
      const message = `<h1>Email Verification</h1><p>Your One-Time Password (OTP) for SchoolPro is: <h2>${otp}</h2></p><p>This OTP is valid for 2 minutes.</p>`;
      await sendEmail({ to: user.email, subject: 'SchoolPro - Verify Your Email', html: message });
    } catch (emailError) {
      console.error("Could not send OTP email:", emailError);
      // Important: If email fails, we might want to undo user/school creation or handle differently.
      return res.status(500).send('Error sending verification email. Please try again or contact support.');
    }

    // Step 5: Success response
    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to continue.'
    });

  } catch (error) {
    console.error('Signup Error:', error.message);
    // Handle specific errors
    if (error.code === 11000) { // Duplicate key errors
      if (error.keyPattern && error.keyPattern.name === 1) { // School name unique index
          return res.status(400).json({ message: 'This school name is already registered.' });
      }
      if (error.keyPattern && error.keyPattern.email === 1) { // User email unique index
          return res.status(400).json({ message: 'A user with this email already exists.' });
      }
    }
    if (error.name === 'ValidationError') { // Mongoose validation errors (like 'name is required')
        const messages = Object.values(error.errors).map(val => val.message);
        // Provide the specific validation message
        return res.status(400).json({ message: messages.join(', ') });
     }
     // Generic server error for other issues
    res.status(500).send('Server error during signup.');
  }
});


// ===== VERIFY OTP ROUTE (Correctly uses user.name) =====
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found.' });
    // Added check for otpExpires existence
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now()) {
         return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    try {
      const message = `<h1>Welcome to SchoolPro, ${user.name}!</h1><p>Your account has been successfully verified.</p><p>You can now log in and start managing your school.</p><p>Thank you for joining us!</p>`;
      await sendEmail({ to: user.email, subject: 'Welcome to SchoolPro!', html: message });
    } catch (emailError) { console.error("Could not send welcome email:", emailError); }
    res.status(200).json({ success: true, message: 'Your account has been verified successfully! Redirecting to login...' });
  } catch (error) { console.error('OTP Verification Error:', error.message); res.status(500).send('Server error during OTP verification.'); }
});

// ===== LOGIN ROUTE (Correctly uses user.name) =====
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(400).json({ message: 'Please verify your email before logging in.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const school = await School.findById(user.schoolId);
    const payload = { user: { id: user.id, role: user.role, name: user.name, schoolId: user.schoolId, schoolName: school ? school.name : 'School Not Found' } };
    jwt.sign( payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => { if (err) throw err; res.json({ token }); } );
  } catch (error) { console.error('Login Error:', error.message); res.status(500).send('Server error during login.'); }
});


// ===== ME ROUTE (UPDATED) =====
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Fetch user data using the ID from the token
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // --- NEW: Fetch the associated school name ---
    const school = await School.findById(user.schoolId).select('name'); // Get only the name field
    const schoolName = school ? school.name : 'School Not Found';
    // --- End NEW ---

    // --- NEW: Combine user data with schoolName for the response ---
    // We need to convert the Mongoose document to a plain object to add properties
    const userObject = user.toObject();
    userObject.schoolName = schoolName; // Add schoolName to the object being sent
    // schoolNameLastUpdated is already part of the User model, so it's included in userObject
    // --- End NEW ---

    res.json(userObject); // Send the combined object

  } catch (error) {
    console.error('Me Route Error:', error.message);
    res.status(500).send('Server Error fetching user profile.');
  }
});


// ===== FORGOT PASSWORD ROUTE (No changes) =====
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' }); // Security measure
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false }); // Avoid validation issues when saving token
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `<h1>Password Reset Request</h1><p>Please click the link below to reset your password. This link is valid for 10 minutes:</p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a><p>If you did not request this, please ignore this email.</p>`;
    await sendEmail({ to: user.email, subject: 'Password Reset Request', html: message });
    res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });
  } catch (err) {
    // Attempt to clear token fields if email sending failed
    try {
        const userToClear = await User.findOne({ email: req.body.email });
        if (userToClear) {
            userToClear.resetPasswordToken = undefined;
            userToClear.resetPasswordExpire = undefined;
            await userToClear.save({ validateBeforeSave: false });
        }
    } catch (clearError) {
        console.error('Error clearing reset token after failed send:', clearError);
    }
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).send('Server Error: Could not process password reset request.'); // More generic error
  }
});


// ===== RESET PASSWORD ROUTE (No changes) =====
router.put('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });
    if (!req.body.password) return res.status(400).json({ message: 'Please provide a new password.' });
    user.password = req.body.password; // Pre-save hook will hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset successful!' });
  } catch (err) { console.error('RESET PASSWORD ERROR:', err.message); res.status(500).send('Server Error during password reset.'); }
});


// ===== RESEND OTP ROUTE (No changes) =====
router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'This email is not registered.' });
      if (user.isVerified) return res.status(400).json({ message: 'This account is already verified.' });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
      try {
        const message = `<h1>New OTP Request</h1><p>Your new One-Time Password (OTP) for SchoolPro is: <h2>${otp}</h2></p><p>This OTP is valid for 2 minutes.</p>`;
        await sendEmail({ to: user.email, subject: 'Your New SchoolPro OTP', html: message });
      } catch (emailError) { console.error("Could not resend OTP email:", emailError); return res.status(500).send('Error sending new OTP. Please try again.'); }
      res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });
    } catch (error) { console.error('Resend OTP Error:', error.message); res.status(500).send('Server Error while resending OTP.'); }
});

module.exports = router;
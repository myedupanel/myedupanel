// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { authMiddleware } = require('../middleware/authMiddleware');

// ===== UPDATED SIGNUP ROUTE =====
router.post('/signup', async (req, res) => {
  const { schoolName, adminName, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ message: 'A user with this email is already registered.' });
    }

    // --- NEW CHECK: Ensure schoolName is unique ONLY for new admins ---
    if (!user || !user.isVerified) { // Only check if it's a completely new user or unverified
      const existingAdminSchool = await User.findOne({ schoolName, role: 'admin' });
      if (existingAdminSchool) {
        return res.status(400).json({ message: 'This school name is already registered by another admin.' });
      }
    }
    // --- End of NEW CHECK ---

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    if (user) {
      // If user exists but is not verified, update their details and OTP
      user.password = password; // Let the pre-save hook hash it
      user.schoolName = schoolName;
      user.adminName = adminName;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // If user does not exist, create a new one
      user = new User({
        schoolName,
        adminName,
        email,
        password, // Let the pre-save hook hash it
        otp,
        otpExpires,
        role: 'admin' // New signups are always admins for now
      });
      await user.save();
    }

    // Send OTP email
    try {
      const message = `<h1>Email Verification</h1><p>Your One-Time Password (OTP) for SchoolPro is: <h2>${otp}</h2></p><p>This OTP is valid for 2 minutes.</p>`;
      await sendEmail({ to: user.email, subject: 'SchoolPro - Verify Your Email', html: message });
    } catch (emailError) {
      console.error("Could not send OTP email:", emailError);
      // Even if email fails, don't block signup, but inform the user.
      // Maybe log this for admin review.
      // Consider deleting the user if OTP can't be sent? For now, we proceed.
      return res.status(500).send('Error sending verification email. Please try again or contact support.');
    }

    // Respond to frontend
    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to continue.'
    });

  } catch (error) {
    console.error('Signup Error:', error.message);
    // Handle potential duplicate email error if somehow the first check missed it
    if (error.code === 11000 && error.keyPattern.email) {
      return res.status(400).json({ message: 'A verified user with this email already exists.' });
    }
    res.status(500).send('Server error during signup.');
  }
});


// ===== VERIFY OTP ROUTE (No changes needed here) =====
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    // --- Debugging logs can be helpful during development ---
    // console.log("--- OTP Verification Debug ---");
    // console.log("Input OTP:", otp, "Stored OTP:", user.otp);
    // console.log("Is OTP same:", user.otp === otp);
    // console.log("Is OTP expired:", user.otpExpires < Date.now());
    // console.log("----------------------------");

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.otp = undefined; // Clear OTP after successful verification
    user.otpExpires = undefined;
    await user.save();

    // Send welcome email after successful verification
    try {
      const message = `
        <h1>Welcome to SchoolPro, ${user.adminName}!</h1>
        <p>Your account has been successfully verified.</p>
        <p>You can now log in and start managing your school.</p>
        <p>Thank you for joining us!</p>
      `;
      await sendEmail({ to: user.email, subject: 'Welcome to SchoolPro!', html: message });
    } catch (emailError) {
      console.error("Could not send welcome email:", emailError);
      // Don't stop the process if welcome email fails, just log it.
    }

    res.status(200).json({
      success: true,
      message: 'Your account has been verified successfully! Redirecting to login...'
    });

  } catch (error) {
    console.error('OTP Verification Error:', error.message);
    res.status(500).send('Server error during OTP verification.');
  }
});

// ===== LOGIN ROUTE (No changes needed here) =====
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the account is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        name: user.adminName,
        schoolName: user.schoolName
      }
    };

    // Sign and send token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }, // Token expires in 5 hours
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).send('Server error during login.');
  }
});


// ===== ME ROUTE (No changes needed here) =====
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Fetch user data using the ID from the token, exclude the password
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found.' }); // Good practice check
    }
    res.json(user);
  } catch (error) {
    console.error('Me Route Error:', error.message);
    res.status(500).send('Server Error fetching user profile.');
  }
});


// ===== FORGOT PASSWORD ROUTE (No changes needed here) =====
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always send a success message to prevent email enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token using the method in the User model
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false }); // Skip validation to save token fields

    // Create reset URL for the email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const message = `
      <h1>Password Reset Request</h1>
      <p>Please click the link below to reset your password. This link is valid for 10 minutes:</p>
      <a href="${resetUrl}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Send the email
    await sendEmail({ to: user.email, subject: 'Password Reset Request', html: message });

    res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });

  } catch (err) {
    // If email sending fails, try to clear the reset token fields
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).send('Server Error: Could not send password reset email.');
  }
});


// ===== RESET PASSWORD ROUTE (No changes needed here) =====
router.put('/reset-password/:token', async (req, res) => {
  try {
    // Hash the token received from the URL to match the one stored in DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user by the hashed token and check expiration
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() } // Check if token is still valid
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    // Check if new password is provided
    if (!req.body.password) {
      return res.status(400).json({ message: 'Please provide a new password.' });
    }

    // Set new password (pre-save hook will hash it) and clear token fields
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save(); // Save the user with the new password

    res.status(200).json({ success: true, message: 'Password reset successful!' });

  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err.message);
    res.status(500).send('Server Error during password reset.');
  }
});


// ===== RESEND OTP ROUTE (No changes needed here) =====
router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ message: 'This email is not registered.' });
      }
      // If already verified, no need to resend OTP
      if (user.isVerified) {
        return res.status(400).json({ message: 'This account is already verified.' });
      }

      // Generate new OTP and expiration time
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 2 * 60 * 1000); // Valid for 2 minutes

      // Update user's OTP fields
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send the new OTP via email
      try {
        const message = `<h1>New OTP Request</h1><p>Your new One-Time Password (OTP) for SchoolPro is: <h2>${otp}</h2></p><p>This OTP is valid for 2 minutes.</p>`;
        await sendEmail({ to: user.email, subject: 'Your New SchoolPro OTP', html: message });
      } catch (emailError) {
        console.error("Could not resend OTP email:", emailError);
        return res.status(500).send('Error sending new OTP. Please try again.');
      }

      res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });

    } catch (error) {
      console.error('Resend OTP Error:', error.message);
      res.status(500).send('Server Error while resending OTP.');
    }
});

module.exports = router; // Export the router
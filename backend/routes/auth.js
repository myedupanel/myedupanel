// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const School = require('../models/School'); // --- BADLAAV 1: School model ko import kiya ---
const sendEmail = require('../utils/sendEmail');
const { authMiddleware } = require('../middleware/authMiddleware');

// ===== UPDATED SIGNUP ROUTE =====
router.post('/signup', async (req, res) => {
  // --- BADLAAV 2: 'adminName' ko 'name' se badla ---
  const { schoolName, name, email, password } = req.body;
  // TODO: Aapko frontend form se location data (city, state, country) bhi lena hoga

  try {
    // Step 1: Check karein ki email pehle se registered hai ya nahi
    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ message: 'A user with this email is already registered.' });
    }

    // Step 2: Check karein ki school name pehle se registered hai ya nahi
    let school = await School.findOne({ name: schoolName });

    let schoolIdToUse;

    if (school) {
      // Agar school pehle se hai
      // Check karein ki yeh naya user hai ya purana unverified user
      if (user && user.isVerified === false && user.schoolId.toString() === school._id.toString()) {
        // Yeh wahi unverified user hai jo dobara try kar raha hai.
        schoolIdToUse = school._id;
      } else {
        // Yeh naya user hai jo purana (existing) school name use kar raha hai. BLOCK.
        return res.status(400).json({ message: 'This school name is already registered.' });
      }
    } else {
      // School naya hai.
      // Check karein ki user (unverified) pehle se hai ya nahi
      if (user && user.schoolId) {
        // User pehle se hai, shayad school name badal raha hai. Unka purana school delete karo.
        await School.findByIdAndDelete(user.schoolId);
      }
      
      // Naya school banao
      const newSchool = new School({
        name: schoolName,
        // TODO: Frontend se asli location data lein, abhi ke liye placeholder
        location: {
          city: 'Not Set',
          state: 'Not Set',
          country: 'Not Set'
        }
      });
      await newSchool.save(); // Agar yeh fail hua (duplicate name), toh catch block chalega
      schoolIdToUse = newSchool._id;
    }

    // Step 3: Naye schoolId ke saath User ko banao ya update karo
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    if (user) {
      // User pehle se hai (unverified), use update karo
      user.password = password; // pre-save hook hash kar dega
      user.name = name; // <-- 'adminName' se 'name' kiya
      user.schoolId = schoolIdToUse; // <-- 'schoolName' se 'schoolId' kiya
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // Naya user banao
      user = new User({
        schoolId: schoolIdToUse, // <-- 'schoolName' se 'schoolId' kiya
        name: name, // <-- 'adminName' se 'name' kiya
        email,
        password, // pre-save hook hash kar dega
        otp,
        otpExpires,
        role: 'admin' // Role set karna zaroori hai
      });
      await user.save();
    }

    // Step 4: OTP email bhejein (ismein koi badlaav nahi)
    try {
      const message = `<h1>Email Verification</h1><p>Your One-Time Password (OTP) for SchoolPro is: <h2>${otp}</h2></p><p>This OTP is valid for 2 minutes.</p>`;
      await sendEmail({ to: user.email, subject: 'SchoolPro - Verify Your Email', html: message });
    } catch (emailError) {
      console.error("Could not send OTP email:", emailError);
      return res.status(500).send('Error sending verification email. Please try again or contact support.');
    }

    // Step 5: Success response bhejein
    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to continue.'
    });

  } catch (error) {
    console.error('Signup Error:', error.message);
    // Duplicate key errors ko handle karein
    if (error.code === 11000) {
      if (error.keyPattern.name) {
        return res.status(400).json({ message: 'This school name is already registered.' });
      }
      if (error.keyPattern.email) {
        return res.status(400).json({ message: 'A user with this email already exists.' });
      }
    }
    res.status(500).send('Server error during signup.');
  }
});


// ===== VERIFY OTP ROUTE =====
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      // --- BADLAAV 3: 'user.adminName' ko 'user.name' kiya ---
      const message = `
        <h1>Welcome to SchoolPro, ${user.name}!</h1> 
        <p>Your account has been successfully verified.</p>
        <p>You can now log in and start managing your school.</p>
        <p>Thank you for joining us!</p>
      `;
      await sendEmail({ to: user.email, subject: 'Welcome to SchoolPro!', html: message });
    } catch (emailError) {
      console.error("Could not send welcome email:", emailError);
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

// ===== LOGIN ROUTE =====
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // --- BADLAAV 4: Token mein 'schoolName' daalne ke liye School model se fetch karein ---
    const school = await School.findById(user.schoolId);

    // Create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        name: user.name, // 'adminName' se 'name' kiya
        schoolId: user.schoolId, // 'schoolId' bhi bhej rahe hain
        schoolName: school ? school.name : 'School Not Found' // 'schoolName' ko fetch karke bheja
      }
    };

    // Sign and send token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
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
    // req.user.id token se aa raha hai
    // Hum 'User' model se data fetch kar rahe hain, jo ab 'name' aur 'schoolId' use karta hai
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        return res.status(444).json({ message: 'User not found.' });
    }
    res.json(user); // Naya user object (name, schoolId ke saath) bhejega
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

    if (!user) {
      return res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false }); 

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>Please click the link below to reset your password. This link is valid for 10 minutes:</p>
      <a href="${resetUrl}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail({ to: user.email, subject: 'Password Reset Request', html: message });

    res.status(200).json({ success: true, message: 'If you use that email exists, a password reset link has been sent.' });

  } catch (err) {
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
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    if (!req.body.password) {
      return res.status(400).json({ message: 'Please provide a new password.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

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
      if (user.isVerified) {
        return res.status(400).json({ message: 'This account is already verified.' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 2 * 60 * 1000);

      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

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
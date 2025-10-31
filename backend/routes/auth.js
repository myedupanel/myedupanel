// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendEmail'); // (Halaanki hum ise signup mein use nahi karenge)
const { authMiddleware } = require('../middleware/authMiddleware');
const { Prisma } = require('@prisma/client');

// ===== SIGNUP ROUTE (FIXED TO BYPASS OTP) =====
router.post('/signup', async (req, res) => {
  const { schoolName, adminName, email, password } = req.body;
  const lowerCaseEmail = email.toLowerCase();

  if (!schoolName || !adminName || !lowerCaseEmail || !password) {
      return res.status(400).json({ message: 'School name, admin name, email, and password are required.' });
  }

  try {
    // Transaction shuru karein
    const result = await prisma.$transaction(async (tx) => {
        // Step 1: Check for existing user
        let user = await tx.user.findUnique({
            where: { email: lowerCaseEmail }
        });

        // --- FIX 1: Ab hum seedha check karenge ki user hai ya nahi ---
        if (user) {
            // User pehle se hai, naya account nahi ban sakta
            throw new Error('A user with this email is already registered.');
        }

        // Step 2: Check for existing school
        let school = await tx.school.findUnique({
            where: { name: schoolName }
        });

        if (school) {
            // School ka naam pehle se registered hai
            throw new Error('This school name is already registered.');
        }
        
        // --- Naya School Banayein ---
        const newSchool = await tx.school.create({
             data: {
                 id: crypto.randomUUID(), // UUID generate karein
                 name: schoolName,
             }
         });
        const schoolIdToUse = newSchool.id;


        // Step 3: Create User (Seedha Verified)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- FIX 2: User ko 'isVerified: true' ke saath banayein ---
        const savedUser = await tx.user.create({
            data: {
                schoolId: schoolIdToUse,
                name: adminName,
                email: lowerCaseEmail,
                password: hashedPassword,
                otp: null, // OTP ki zaroorat nahi
                otpExpires: null, // Expiry ki zaroorat nahi
                role: 'Admin',
                isVerified: true // <-- SEEDHA VERIFIED
            }
        });
        
        return savedUser; // User ko return karein
    }); // Transaction yahaan khatam

    // --- FIX 3: Email waala step poori tarah SKIP kar diya ---
    // const message = `...`;
    // await sendEmail(...); 

    // Step 5: Success response (Message badal diya)
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please log in.' // <-- Naya message
    });

  } catch (error) {
    console.error('Signup Error:', error.message);

    // Handle Prisma unique constraint errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
             const target = error.meta?.target || [];
             if (target.includes('email')) {
                 return res.status(400).json({ message: 'A user with this email already exists.' });
             }
             if (target.includes('name') && error.meta?.modelName === 'School') { 
                 return res.status(400).json({ message: 'This school name is already registered.' });
             }
             return res.status(400).json({ message: `Duplicate entry error on ${target.join(', ')}.` });
        }
    }
    // Handle custom errors thrown from inside transaction
    if (error.message === 'A user with this email is already registered.' || error.message === 'This school name is already registered.') {
        return res.status(400).json({ message: error.message });
    }
    
    // Baaki sab errors
    res.status(500).send('An unexpected server error occurred during signup.');
  }
});
// --- END SIGNUP FIX ---


// ===== VERIFY OTP ROUTE (Ab use nahi hoga, par rakha hai) =====
router.post('/verify-otp', async (req, res) => {
  // ... (is function mein koi change nahi) ...
  const { email, otp } = req.body;
  const lowerCaseEmail = email ? email.toLowerCase() : '';
  try {
    const user = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
    if (!user) return res.status(400).json({ message: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified.' });
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
         return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    const updatedUser = await prisma.user.update({
        where: { email: lowerCaseEmail },
        data: { isVerified: true, otp: null, otpExpires: null }
    });
    try {
      const message = `<h1>Welcome to SchoolPro, ${updatedUser.name}!</h1><p>Your account has been successfully verified.</p>`;
      await sendEmail({ to: updatedUser.email, subject: 'Welcome to SchoolPro!', html: message });
    } catch (emailError) { console.error("Could not send welcome email:", emailError); }
    res.status(200).json({ success: true, message: 'Your account has been verified successfully! Redirecting to login...' });
  } catch (error) { console.error('OTP Verification Error:', error.message); res.status(500).send('Server error during OTP verification.'); }
});

// ===== LOGIN ROUTE (No Change) =====
router.post('/login', async (req, res) => {
  // ... (is function mein koi change nahi) ...
  const { email, password } = req.body;
  const lowerCaseEmail = email ? email.toLowerCase() : '';
  try {
    const user = await prisma.user.findUnique({
        where: { email: lowerCaseEmail },
        include: { school: { select: { name: true } } }
    });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    // --- FIX: Login ab seedha check karega ---
    // if (!user.isVerified) return res.status(400).json({ message: 'Please verify your email...' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const payload = {
        id: user.id, role: user.role, name: user.name,
        schoolId: user.schoolId, schoolName: user.school?.name || 'School Not Found'
    };
    jwt.sign( payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
    } );
  } catch (error) { console.error('Login Error:', error.message); res.status(500).send('Server error during login.'); }
});

// ===== ME ROUTE (No Change) =====
router.get('/me', authMiddleware, async (req, res) => {
  // ... (is function mein koi change nahi) ...
  try {
    if (!req.user || !req.user.id) {
        return res.status(404).json({ message: 'User not found from token.' });
    }
    res.json(req.user);
  } catch (error) {
    console.error('Me Route Error:', error.message);
    res.status(500).send('Server Error fetching user profile.');
  }
});

// ===== FORGOT PASSWORD ROUTE (No Change) =====
router.post('/forgot-password', async (req, res) => {
  // ... (is function mein koi change nahi) ...
  try {
    const { email } = req.body;
    const lowerCaseEmail = email ? email.toLowerCase() : '';
    const user = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
    if (!user) return res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpire = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
        where: { email: lowerCaseEmail },
        data: { resetPasswordToken: hashedToken, resetPasswordExpire: resetExpire }
    });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `<h1>Password Reset Request</h1><p>Please click the link below to reset your password...</p><a href="${resetUrl}" ...>Reset Password</a>`;
    await sendEmail({ to: user.email, subject: 'Password Reset Request', html: message });
    res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).send('Server Error: Could not process password reset request.');
  }
});

// ===== RESET PASSWORD ROUTE (No Change) =====
router.put('/reset-password/:token', async (req, res) => {
  // ... (is function mein koi change nahi) ...
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await prisma.user.findFirst({
        where: { resetPasswordToken: hashedToken, resetPasswordExpire: { gt: new Date() } }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });
    if (!req.body.password) return res.status(400).json({ message: 'Please provide a new password.' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpire: null }
    });
    res.status(200).json({ success: true, message: 'Password reset successful!' });
  } catch (err) { console.error('RESET PASSWORD ERROR:', err.message); res.status(500).send('Server error during password reset.'); }
});

// ===== RESEND OTP ROUTE (Ab use nahi hoga, par rakha hai) =====
router.post('/resend-otp', async (req, res) => {
  // ... (is function mein koi change nahi) ...
    const { email } = req.body;
    const lowerCaseEmail = email ? email.toLowerCase() : '';
    try {
      const user = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
      if (!user) return res.status(400).json({ message: 'This email is not registered.' });
      if (user.isVerified) return res.status(400).json({ message: 'This account is already verified.' });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 2 * 60 * 1000);
      await prisma.user.update({
          where: { email: lowerCaseEmail },
          data: { otp: otp, otpExpires: otpExpires }
      });
      try {
        const message = `<h1>New OTP Request</h1><p>Your new OTP is: <h2>${otp}</h2></p>`;
        await sendEmail({ to: user.email, subject: 'Your New SchoolPro OTP', html: message });
      } catch (emailError) { console.error("Could not resend OTP email:", emailError); return res.status(500).send('Error sending new OTP. Please try again.'); }
      res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });
    } catch (error) { console.error('Resend OTP Error:', error.message); res.status(500).send('Server Error while resending OTP.'); }
});

module.exports = router;
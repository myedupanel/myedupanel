// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Password hash ke liye
const jwt = require('jsonwebtoken'); // Token ke liye
const crypto = require('crypto'); // Password reset token ke liye
const prisma = require('../config/prisma'); // Prisma client
const sendEmail = require('../utils/sendEmail');
const { authMiddleware } = require('../middleware/authMiddleware');
const { Prisma } = require('@prisma/client'); // Prisma errors ke liye

// ===== SIGNUP ROUTE =====
router.post('/signup', async (req, res) => {
  const { schoolName, adminName, email, password } = req.body;
  const lowerCaseEmail = email.toLowerCase(); // Consistent casing

  // Basic validation
  if (!schoolName || !adminName || !lowerCaseEmail || !password) {
      return res.status(400).json({ message: 'School name, admin name, email, and password are required.' });
  }

  try {
    // Transaction shuru karein taaki School aur User saath mein bane ya fail ho
    const result = await prisma.$transaction(async (tx) => {
        // Step 1: Check for existing verified user
        let user = await tx.user.findUnique({
            where: { email: lowerCaseEmail }
        });

        if (user && user.isVerified) {
            throw new Error('A user with this email is already registered.'); // Error throw karein transaction rokne ke liye
        }

        // Step 2: Check for existing school
        // Prisma mein ID string hai, seedha check karein
        let school = await tx.school.findUnique({
            where: { name: schoolName } // Assuming school name is unique
        });

        let schoolIdToUse;
        let createdSchool = null; // Track agar naya school bana

        if (school) {
            // School exists
            if (user && user.isVerified === false && user.schoolId === school.id) {
                // Same unverified user trying again for the same school
                schoolIdToUse = school.id;
            } else {
                throw new Error('This school name is already registered.');
            }
        } else {
            // New school
            // Prisma mein schoolId String hai, findByIdAndDelete ki zaroorat nahi
            // Agar pehle user bana tha toh schoolId galat hoga, use update karenge

            // Create new school
             createdSchool = await tx.school.create({
                 data: {
                     // Prisma ID automatically generate karega (UUID ya CUID, schema par depend karta hai)
                     // Agar aapko schoolId explicitly set karna hai, toh schema update karna hoga
                     id: crypto.randomUUID(), // Example: Generate a UUID if schema needs it
                     name: schoolName,
                     // Baaki fields (address, etc.) yahaan add karein ya optional rakhein
                 }
             });
            schoolIdToUse = createdSchool.id;
        }

        // Step 3: Create or Update User with schoolId
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let savedUser;
        if (user) {
            // Update existing unverified user
            savedUser = await tx.user.update({
                where: { email: lowerCaseEmail },
                data: {
                    password: hashedPassword,
                    name: adminName,
                    schoolId: schoolIdToUse,
                    otp: otp,
                    otpExpires: otpExpires,
                    role: 'Admin' // Ensure role is set/updated
                }
            });
        } else {
            // Create new user
            savedUser = await tx.user.create({
                data: {
                    schoolId: schoolIdToUse,
                    name: adminName,
                    email: lowerCaseEmail,
                    password: hashedPassword,
                    otp: otp,
                    otpExpires: otpExpires,
                    role: 'Admin' // Role 'Admin' set karein
                }
            });
        }
        // Return user and createdSchool (agar bana hai)
        return { user: savedUser, createdSchool };
    }); // Transaction yahaan khatam

    // Step 4: Send OTP email (transaction ke bahar)
    try {
      const message = `<h1>Email Verification</h1><p>Your One-Time Password (OTP) for SchoolPro is: <h2>${result.user.otp}</h2></p><p>This OTP is valid for 2 minutes.</p>`;
      await sendEmail({ to: result.user.email, subject: 'SchoolPro - Verify Your Email', html: message });
    } catch (emailError) {
      console.error("Could not send OTP email:", emailError);
      // Agar email fail ho, toh user/school ko delete karna padega jo transaction mein bane the
      // Ya user ko manually verify karne ka option dein
      // Abhi ke liye, error message bhejte hain
      if (result.createdSchool) {
          // Agar naya school bana tha toh use delete karein
          await prisma.school.delete({ where: { id: result.createdSchool.id } }).catch(delErr => console.error("Cleanup Error: Failed to delete school after email failure:", delErr));
      }
       if (result.user) {
          // Agar naya user bana tha toh use delete karein
          await prisma.user.delete({ where: { id: result.user.id } }).catch(delErr => console.error("Cleanup Error: Failed to delete user after email failure:", delErr));
      }
      return res.status(500).send('Error sending verification email. Please try signing up again.');
    }

    // Step 5: Success response
    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to continue.'
    });

  } catch (error) {
    console.error('Signup Error:', error.message);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation (P2002)
        if (error.code === 'P2002') {
             const target = error.meta?.target || [];
             if (target.includes('email')) {
                 return res.status(400).json({ message: 'A user with this email already exists.' });
             }
             if (target.includes('name') && error.modelName === 'School') { // Check agar School model ka 'name' field duplicate hai
                 return res.status(400).json({ message: 'This school name is already registered.' });
             }
             return res.status(400).json({ message: `Duplicate entry error on ${target.join(', ')}.` });
        }
    }
    // Transaction se throw kiya gaya custom error message
    if (error.message === 'A user with this email is already registered.' || error.message === 'This school name is already registered.') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).send('Server error during signup.');
  }
});


// ===== VERIFY OTP ROUTE =====
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const lowerCaseEmail = email.toLowerCase();
  try {
    const user = await prisma.user.findUnique({
        where: { email: lowerCaseEmail }
    });

    if (!user) return res.status(400).json({ message: 'User not found.' });

    if (user.isVerified) return res.status(400).json({ message: 'Account already verified.' });

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) { // Date object se compare karein
         return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Mongoose save() ko Prisma update se badla
    const updatedUser = await prisma.user.update({
        where: { email: lowerCaseEmail },
        data: {
            isVerified: true,
            otp: null,          // Prisma mein undefined nahi, null use karein
            otpExpires: null
        }
    });

    try {
      const message = `<h1>Welcome to SchoolPro, ${updatedUser.name}!</h1><p>Your account has been successfully verified.</p><p>You can now log in and start managing your school.</p><p>Thank you for joining us!</p>`;
      await sendEmail({ to: updatedUser.email, subject: 'Welcome to SchoolPro!', html: message });
    } catch (emailError) { console.error("Could not send welcome email:", emailError); }

    res.status(200).json({ success: true, message: 'Your account has been verified successfully! Redirecting to login...' });
  } catch (error) { console.error('OTP Verification Error:', error.message); res.status(500).send('Server error during OTP verification.'); }
});

// ===== LOGIN ROUTE =====
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const lowerCaseEmail = email.toLowerCase();
  try {
    // Mongoose findOne ko Prisma findUnique se badla, include school
    const user = await prisma.user.findUnique({
        where: { email: lowerCaseEmail },
        include: { school: true } // School details saath mein fetch karein
    });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) return res.status(400).json({ message: 'Please verify your email before logging in.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Payload banayein Prisma data se
    const payload = {
        // user object ko directly use na karein, specific fields daalein
        id: user.id,            // Prisma ID (Int)
        role: user.role,
        name: user.name,
        schoolId: user.schoolId,  // Prisma schoolId (String)
        schoolName: user.school?.name || 'School Not Found' // Included school se naam lein
    };

    // JWT sign karein
    jwt.sign( payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
    } );
  } catch (error) { console.error('Login Error:', error.message); res.status(500).send('Server error during login.'); }
});


// ===== ME ROUTE =====
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // authMiddleware ab req.user mein Prisma user object (bina password) daal raha hai
    if (!req.user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // School ka naam pehle se hi req.user mein hona chahiye (authMiddleware se)
    // Agar nahi hai, toh fetch karein
    let userProfile = req.user;
    if (!userProfile.schoolName && userProfile.schoolId) {
        const school = await prisma.school.findUnique({
            where: { id: userProfile.schoolId },
            select: { name: true }
        });
        userProfile.schoolName = school?.name || 'School Not Found';
    }

    // Mongoose .toObject() ki zaroorat nahi
    res.json(userProfile);

  } catch (error) {
    console.error('Me Route Error:', error.message);
    res.status(500).send('Server Error fetching user profile.');
  }
});


// ===== FORGOT PASSWORD ROUTE =====
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    // Mongoose findOne ko Prisma findUnique se badla
    const user = await prisma.user.findUnique({
        where: { email: lowerCaseEmail }
    });

    if (!user) return res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' }); // Security measure

    // Mongoose getResetPasswordToken ko manually implement karein
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Mongoose save() ko Prisma update se badla
    await prisma.user.update({
        where: { email: lowerCaseEmail },
        data: {
            resetPasswordToken: hashedToken,
            resetPasswordExpire: resetExpire
        }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`; // Original token URL mein bhejein
    const message = `<h1>Password Reset Request</h1><p>Please click the link below to reset your password. This link is valid for 10 minutes:</p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a><p>If you did not request this, please ignore this email.</p>`;
    await sendEmail({ to: user.email, subject: 'Password Reset Request', html: message });

    res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
     // Clear token logic yahaan zaroori nahi, update fail hoga toh token save nahi hoga
    res.status(500).send('Server Error: Could not process password reset request.');
  }
});


// ===== RESET PASSWORD ROUTE =====
router.put('/reset-password/:token', async (req, res) => {
  try {
    // Token ko hash karein find karne ke liye
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // Mongoose findOne ko Prisma findFirst se badla (token unique nahi hai)
    const user = await prisma.user.findFirst({
        where: {
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { gt: new Date() } // Check expire time
        }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

    if (!req.body.password) return res.status(400).json({ message: 'Please provide a new password.' });

    // Password hash karein
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Mongoose save() ko Prisma update se badla
    await prisma.user.update({
        where: { id: user.id }, // User ID se update karein
        data: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpire: null
        }
    });

    res.status(200).json({ success: true, message: 'Password reset successful!' });
  } catch (err) { console.error('RESET PASSWORD ERROR:', err.message); res.status(500).send('Server Error during password reset.'); }
});


// ===== RESEND OTP ROUTE =====
router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;
    const lowerCaseEmail = email.toLowerCase();
    try {
      // Mongoose findOne ko Prisma findUnique se badla
      const user = await prisma.user.findUnique({
          where: { email: lowerCaseEmail }
      });

      if (!user) return res.status(400).json({ message: 'This email is not registered.' });
      if (user.isVerified) return res.status(400).json({ message: 'This account is already verified.' });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

      // Mongoose save() ko Prisma update se badla
      await prisma.user.update({
          where: { email: lowerCaseEmail },
          data: {
              otp: otp,
              otpExpires: otpExpires
          }
      });

      try {
        const message = `<h1>New OTP Request</h1><p>Your new One-Time Password (OTP) for SchoolPro is: <h2>${otp}</h2></p><p>This OTP is valid for 2 minutes.</p>`;
        await sendEmail({ to: user.email, subject: 'Your New SchoolPro OTP', html: message });
      } catch (emailError) { console.error("Could not resend OTP email:", emailError); return res.status(500).send('Error sending new OTP. Please try again.'); }

      res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });
    } catch (error) { console.error('Resend OTP Error:', error.message); res.status(500).send('Server Error while resending OTP.'); }
});

module.exports = router; 
// File: backend/routes/parentAuth.js
// Parent-specific authentication routes with RBAC

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendEmail');

// Parent Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const lowerCaseEmail = email.toLowerCase();
  
  try {
    // Find parent user with role 'Parent'
    const user = await prisma.user.findUnique({
      where: { 
        email: lowerCaseEmail,
        role: 'Parent'
      },
      include: { 
        school: true,
        parent: {
          include: {
            student: {
              include: {
                class: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials or not a parent account' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if parent is linked to a student
    if (!user.parent || !user.parent.student) {
      return res.status(400).json({ message: 'Parent account not properly configured. Please contact administrator.' });
    }

    const payload = {
      id: user.id,
      role: user.role,
      name: user.name,
      schoolId: user.schoolId,
      schoolName: user.school?.name || 'School Not Found',
      parentId: user.parent.id,
      studentId: user.parent.student.studentid,
      studentName: `${user.parent.student.first_name} ${user.parent.student.last_name}`
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            schoolName: user.school?.name,
            student: {
              id: user.parent.student.studentid,
              name: `${user.parent.student.first_name} ${user.parent.student.last_name}`,
              class: user.parent.student.class?.class_name,
              rollNumber: user.parent.student.roll_number
            }
          }
        });
      }
    );
  } catch (error) {
    console.error('Parent Login Error:', error.message);
    res.status(500).send('Server error during login.');
  }
});

// Parent Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { 
        email: lowerCaseEmail,
        role: 'Parent'
      }
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If a parent account with that email exists, a password reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: resetExpire
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/parent/reset-password/${resetToken}`;
    const message = `
      <h1>Password Reset Request</h1>
      <p>Please click the link below to reset your parent portal password. This link is valid for 10 minutes:</p>
      <a href="${resetUrl}" style="padding: 10px 15px; background-color: #6366F1; color: white; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p>If you did not request this, please ignore this email.</p>
    `;
    
    await sendEmail({
      to: user.email,
      subject: 'Parent Portal - Password Reset Request',
      html: message
    });

    res.status(200).json({
      success: true,
      message: 'If a parent account with that email exists, a password reset link has been sent.'
    });
  } catch (err) {
    console.error('PARENT FORGOT PASSWORD ERROR:', err);
    res.status(500).send('Server Error: Could not process password reset request.');
  }
});

// Parent Reset Password Route
router.put('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { gt: new Date() },
        role: 'Parent'
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    if (!req.body.password) {
      return res.status(400).json({ message: 'Please provide a new password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null
      }
    });

    res.status(200).json({ success: true, message: 'Password reset successful!' });
  } catch (err) {
    console.error('PARENT RESET PASSWORD ERROR:', err.message);
    res.status(500).send('Server Error during password reset.');
  }
});

// Parent Profile Route
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'Parent') {
      return res.status(403).json({ message: 'Access denied. Parent role required.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        school: true,
        parent: {
          include: {
            student: {
              include: {
                class: true,
                attendances: {
                  take: 10,
                  orderBy: { date: 'desc' }
                },
                marks: {
                  take: 10,
                  orderBy: { assessmentId: 'desc' },
                  include: {
                    assessment: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.parent) {
      return res.status(404).json({ message: 'Parent profile not found.' });
    }

    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: {
        id: user.school.id,
        name: user.school.name
      },
      student: {
        id: user.parent.student.studentid,
        firstName: user.parent.student.first_name,
        lastName: user.parent.student.last_name,
        fullName: `${user.parent.student.first_name} ${user.parent.student.last_name}`,
        rollNumber: user.parent.student.roll_number,
        class: user.parent.student.class?.class_name,
        dob: user.parent.student.dob,
        address: user.parent.student.address,
        recentAttendance: user.parent.student.attendances,
        recentMarks: user.parent.student.marks.map(mark => ({
          subject: mark.subject,
          marksObtained: mark.marksObtained,
          maxMarks: mark.maxMarks,
          percentage: mark.percentage,
          grade: mark.grade,
          examName: mark.assessment?.name,
          examDate: mark.assessment?.date
        }))
      }
    };

    res.json(profileData);
  } catch (error) {
    console.error('Parent Profile Error:', error.message);
    res.status(500).send('Server Error fetching parent profile.');
  }
});

module.exports = router;
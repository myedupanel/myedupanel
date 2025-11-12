// backend/routes/teachers.js

const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma'); // Prisma client
const bcrypt = require('bcryptjs'); // Password hashing ke liye
const generatePassword = require('generate-password'); // Temp password ke liye
const sendEmail = require('../utils/sendEmail');
const { authMiddleware, authorize } = require('../middleware/authMiddleware'); // Updated middleware

// @route   POST /api/teachers
// @desc    Add a new teacher, create user account, send email
// @access  Private (Admin Only)
router.post('/', [authMiddleware, authorize('Admin')], async (req, res) => { // Role 'Admin' check
  try {
    const { teacherId, name, subject, contactNumber, email } = req.body;
    const schoolId = req.user.schoolId; // Middleware se mila

    // Basic Validation
    if (!teacherId || !name || !subject || !contactNumber || !email) {
      return res.status(400).json({ message: 'Please provide all required teacher details.' });
    }
     if (!schoolId) {
         return res.status(400).json({ message: 'Admin school details missing.' });
     }
    const lowerCaseEmail = email.toLowerCase();

    // --- Prisma Transaction ---
    // User aur Teacher dono ek saath banayein
    const result = await prisma.$transaction(async (tx) => {
        // 1. Check existing Teacher (by teacherId OR email within the school)
        const existingTeacher = await tx.teachers.findFirst({
            where: { 
                schoolId: schoolId, 
                OR: [
                    { email: lowerCaseEmail }, 
                    { teacherId: teacherId } // Prisma schema mein teacherId schoolId ke saath unique hai
                ]
             }
         });
        if (existingTeacher) {
          throw new Error('A teacher with this email or ID already exists in this school.'); 
        }

        // 2. Check existing User (email globally unique)
        const existingUser = await tx.user.findUnique({ where: { email: lowerCaseEmail } });
        if (existingUser) {
          throw new Error('A user account with this email already exists.');
        }

        // 3. Generate and Hash Password
        const password = generatePassword.generate({ length: 10, numbers: true });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create User account
        const newUser = await tx.user.create({
          data: {
            name: name,
            email: lowerCaseEmail,
            password: hashedPassword,
            role: 'Teacher', // Mongoose code 'teacher' use kar raha tha
            schoolId: schoolId,
            status: 'active', // Mongoose code mein isVerified nahi tha, active maan lete hain
            createdById: req.user.id // Admin ki ID
          }
        });

        // 5. Create Teacher record
        const newTeacher = await tx.teachers.create({
          data: {
            teacherId,
            name,
            subject: subject,
            contactNumber,
            email: lowerCaseEmail,
            schoolId: schoolId,
            academicYearId: req.academicYearId // NAYA: Academic year ID ko add karein
          }
        });
        
        // Transaction se password return karein taaki email mein bhej sakein
        return { newTeacher, password }; 
    }); // --- Transaction Khatam ---

    // Send welcome email (Transaction ke bahar)
    try {
      const message = `<h1>Welcome, ${result.newTeacher.name}!</h1><p>Account created.</p><ul><li>Email: ${result.newTeacher.email}</li><li>Password: ${result.password}</li></ul><p>Change password after login.</p>`;
      await sendEmail({ to: result.newTeacher.email, subject: 'Your Teacher Account Details', html: message });
    } catch (emailError) {
      console.error("Could not send welcome email to teacher:", emailError);
      // Agar email fail ho toh bhi response success ka dein (teacher ban chuka hai)
       return res.status(201).json({ 
           message: `Teacher created, but failed to send email. Share password manually: ${result.password}`, 
           teacher: result.newTeacher 
        });
    }

    // Socket events (Same logic)
    if (req.io) {
        req.io.emit('updateDashboard');
        req.io.emit('teacher_added', result.newTeacher);
    } else {
       console.warn('Socket.IO instance not found.');
    }

    res.status(201).json({ message: 'Teacher created and welcome email sent.', teacher: result.newTeacher });

  } catch (err) {
    console.error("Error creating teacher:", err);
    // Prisma Unique constraint errors
    if (err.code === 'P2002') {
        if (err.meta?.target?.includes('email')) {
             return res.status(400).json({ message: 'A user or teacher with this email already exists.' });
        } else if (err.meta?.target?.includes('teacherId')) {
             return res.status(400).json({ message: 'A teacher with this ID already exists in this school.' });
        } else {
             return res.status(400).json({ message: 'A unique constraint error occurred.' });
        }
    }
    // Agar transaction ke andar se custom error throw kiya tha
    if (err.message.includes('already exists')) {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).send('Server Error creating teacher');
  }
});

// @route   GET /api/teachers
// @desc    Get all teachers for the admin's school
// @access  Private (Admin or Teacher)
// NOTE: Yeh function humne pehle hi controller mein update kar diya tha.
const teacherController = require('../controllers/teacherController'); // Controller import karein
router.get('/', [authMiddleware], teacherController.getAllTeachers); // Controller function use karein


// @route   PUT /api/teachers/:id (Teacher's Prisma DB ID - teacher_dbid)
// @desc    Update a teacher's details
// @access  Private (Admin Only)
router.put('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role Check Admin
  try {
    const teacherDbIdInt = parseInt(req.params.id); // Yeh Prisma ka internal ID hai
    if (isNaN(teacherDbIdInt)) {
        return res.status(400).json({ message: 'Invalid teacher ID format.' });
    }

    // Update data prepare karein
    const updateData = {};
    const body = req.body;
    if (body.name) updateData.name = body.name;
    if (body.subject) updateData.subject = body.subject;
    if (body.contactNumber) updateData.contactNumber = body.contactNumber;
    // Email aur teacherId update nahi karne denge (unique constraints)
    
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    // --- Prisma Transaction ---
    // Teacher aur User dono ko update karein
    const updatedTeacher = await prisma.$transaction(async (tx) => {
        // 1. Teacher ko update karein
        const teacher = await tx.teachers.update({
          where: { 
              teacher_dbid: teacherDbIdInt, 
              schoolId: req.user.schoolId // School check zaroori
          }, 
          data: updateData 
        });

        // 2. Agar naam update hua hai, toh linked User ka naam bhi update karein
        if (updateData.name) {
            try {
                await tx.user.update({
                  where: { 
                      email: teacher.email, // Email se User ko dhoondhein
                      schoolId: req.user.schoolId // School check
                  }, 
                  data: { name: updateData.name } 
                });
                console.log(`[PUT /teachers] Updated linked User name for email: ${teacher.email}`);
            } catch(userUpdateError) {
                // Agar user nahi mila (P2025), toh ignore karein (shayad manually delete ho gaya ho)
                if (userUpdateError.code !== 'P2025') {
                    console.error(`[PUT /teachers] Error updating linked User name:`, userUpdateError);
                    // Transaction rollback nahi kar rahe hain, teacher update ho chuka hai
                } else {
                     console.warn(`[PUT /teachers] Linked User not found for email ${teacher.email} during name update.`);
                }
            }
        }
        return teacher; // Updated teacher ko return karein
    }); // --- Transaction Khatam ---

     // Socket events
     if (req.io) {
        req.io.emit('updateDashboard');
        req.io.emit('teacher_updated', updatedTeacher);
     } else {
        console.warn('Socket.IO instance not found.');
     }

    res.json({ message: 'Teacher updated successfully', teacher: updatedTeacher });

  } catch (err) {
    console.error("Error updating teacher:", err);
    if (err.code === 'P2025') { // Record to update not found
        return res.status(404).json({ message: 'Teacher not found or access denied.' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/teachers/:id (Teacher's Prisma DB ID - teacher_dbid)
// @desc    Delete a teacher and their user account
// @access  Private (Admin Only)
router.delete('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role check Admin
  try {
    const teacherDbIdInt = parseInt(req.params.id);
    if (isNaN(teacherDbIdInt)) {
      return res.status(400).json({ message: 'Invalid teacher ID format.' });
    }

    // Pehle teacher ko fetch karein taaki email mil sake User ko delete karne ke liye
    const teacher = await prisma.teachers.findUnique({
        where: { teacher_dbid: teacherDbIdInt, schoolId: req.user.schoolId } // School check
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found or access denied.' });
    }
    
    const teacherEmail = teacher.email; // User ko delete karne ke liye email

    // --- Prisma Transaction ---
    // Teacher aur User dono ko delete karein
    await prisma.$transaction(async (tx) => {
        // 1. Teacher record delete karein
        await tx.teachers.delete({
            where: { teacher_dbid: teacherDbIdInt }
        });
        console.log(`[DELETE /teachers] Deleted teacher record: ${teacherDbIdInt}`);

        // 2. Linked User account delete karein (email aur schoolId se)
        try {
            await tx.user.delete({
                where: { email: teacherEmail, schoolId: req.user.schoolId } // School check zaroori
            });
            console.log(`[DELETE /teachers] Deleted linked user account: ${teacherEmail}`);
        } catch (userDeleteError) {
             // Agar user nahi mila (P2025), toh ignore karein
             if (userDeleteError.code !== 'P2025') {
                 console.error(`[DELETE /teachers] Error deleting user ${teacherEmail}:`, userDeleteError);
                 throw userDeleteError; // Transaction rollback hoga
             } else {
                  console.log(`[DELETE /teachers] Linked user ${teacherEmail} not found, maybe already deleted.`);
             }
        }
    }); // --- Transaction Khatam ---

     // Socket events
     if (req.io) {
        req.io.emit('updateDashboard');
        // Frontend ko Prisma ID bhejein delete confirmation ke liye
        req.io.emit('teacher_deleted', { id: teacherDbIdInt }); 
     } else {
        console.warn('Socket.IO instance not found.');
     }

    res.json({ message: 'Teacher and associated user account removed successfully' });

  } catch (err) {
    console.error("Error deleting teacher:", err);
    if (err.code === 'P2025') { // Record to delete not found
        return res.status(404).json({ message: 'Teacher not found or access denied.' });
    }
     // Foreign key error (agar teacher kisi cheez se linked hai jo delete nahi ho sakta)
    if (err.code === 'P2003' || err.code === 'P2014') { 
        return res.status(400).json({ msg: 'Cannot delete teacher. They might be linked to other records.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
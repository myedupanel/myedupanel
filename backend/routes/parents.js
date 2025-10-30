// backend/routes/parents.js

const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma'); // Prisma client
const bcrypt = require('bcryptjs'); // Password hashing
const generatePassword = require('generate-password'); // Temp password
const sendEmail = require('../utils/sendEmail');
const { authMiddleware, authorize } = require('../middleware/authMiddleware'); // Updated middleware

// Helper: Get Full Name (Student ke liye)
const getFullName = (student) => {
  return [student?.first_name, student?.father_name, student?.last_name].filter(Boolean).join(' ');
}

// @route   GET /api/parents
// @desc    Get all parents for the admin's school
// @access  Private (Admin)
router.get('/', [authMiddleware, authorize('Admin')], async (req, res) => { // Role Check Admin
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
        return res.status(400).json({ msg: 'School information missing.' });
    }
    const parents = await prisma.parent.findMany({
        where: { schoolId: schoolId },
        include: { // Populate student name and class
            student: {
                select: {
                    studentid: true, // Prisma ID
                    first_name: true,
                    father_name: true,
                    last_name: true,
                    class: { select: { class_name: true } }
                }
            }
        },
        orderBy: { id: 'desc' } // createdAt ke bajaye
    });

    // Format response (Mongoose jaisa)
    const formattedParents = parents.map(p => ({
        ...p,
        id: p.id, // Prisma ID ko id banayein
        studentId: { // Populate jaisa object banayein
            id: p.student.studentid,
            name: getFullName(p.student),
            class: p.student.class.class_name
        }
    }));

    res.json(formattedParents);
  } catch (err) {
    console.error("Error fetching parents:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/parents
// @desc    Add new parent & create User account
// @access  Private (Admin)
router.post('/', [authMiddleware, authorize('Admin')], async (req, res) => { // Role Check Admin
  const { name, contactNumber, email, occupation, studentId } = req.body; // studentId abhi bhi Mongoose ID string ho sakta hai frontend se
  const schoolId = req.user.schoolId;

  // Basic validation
  if (!name || !contactNumber || !email || !studentId) {
       return res.status(400).json({ msg: 'Please provide Name, Contact, Email, and select a Student.' });
  }
  const studentIdInt = parseInt(studentId); // Mongoose ID ko Int mein badlein
   if (isNaN(studentIdInt)) {
        return res.status(400).json({ msg: 'Invalid Student ID format.' });
   }
  if (!schoolId) {
      return res.status(400).json({ msg: 'Admin school information missing.' });
  }
  const lowerCaseEmail = email.toLowerCase();

  try {
    // --- Prisma Transaction ---
    const result = await prisma.$transaction(async (tx) => {
        // 1. Check student exists in this school
        const studentExists = await tx.students.findUnique({
            where: { studentid: studentIdInt, schoolId: schoolId }
        });
        if (!studentExists) {
          throw new Error('Selected student not found in your school.');
        }

        // 2. Check if Parent with this email already exists *in this school*
        const existingParentInSchool = await tx.parent.findUnique({
            where: { schoolId_email: { schoolId, email: lowerCaseEmail } }
        });
         if (existingParentInSchool) {
            throw new Error('A parent with this email already exists in this school.');
        }

        // 3. Check if a User with this email exists (globally unique)
        let existingUser = await tx.user.findUnique({ where: { email: lowerCaseEmail } });
        if (existingUser) {
           // Block if user exists (policy decision from Mongoose code)
           throw new Error(`A user account (role: ${existingUser.role}) with this email already exists.`);
        }

        // 4. Generate & Hash Password
        const password = generatePassword.generate({ length: 10, numbers: true });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create User document
        console.log(`[POST /parents] Creating User for parent: ${name}`);
        const newUser = await tx.user.create({
            data: {
                name: name,
                email: lowerCaseEmail,
                password: hashedPassword,
                role: 'Parent', // Mongoose 'parent' use kar raha tha, Schema mein update karna pad sakta hai agar 'Parent' use karna hai
                schoolId: schoolId,
                status: 'active', // Mongoose 'isVerified: true' use kar raha tha
                createdById: req.user.id // Admin ki ID
            }
        });
        console.log(`[POST /parents] User saved with ID: ${newUser.id}`);

        // 6. Create Parent document
        console.log(`[POST /parents] Creating Parent document for: ${name}`);
        const newParent = await tx.parent.create({
            data: {
                name,
                contactNumber,
                email: lowerCaseEmail, // Email Parent mein bhi save karein
                occupation,
                studentId: studentIdInt, // Link to student (Prisma ID)
                schoolId: schoolId,
                userId: newUser.id // Link to User account
            }
        });
        console.log(`[POST /parents] Parent saved with ID: ${newParent.id}`);

        // Transaction se password aur newParent return karein
        return { newParent, password };
    }); // --- Transaction Khatam ---

    // 7. Send email (Transaction ke bahar)
    try {
        const subject = 'Your Parent Account Details';
        const message = `<h1>Welcome, ${result.newParent.name}!</h1><p>Account created.</p><ul><li>Email: ${result.newParent.email}</li><li>Password: ${result.password}</li></ul>`;
        await sendEmail({ to: result.newParent.email, subject, html: message });
        console.log(`[POST /parents] Welcome email sent to ${result.newParent.email}`);
    } catch (emailError) {
        console.error(`[POST /parents] Could not send email:`, emailError);
        // Don't fail if email fails
    }

    // 8. Socket emit (Same)
    if (req.io) {
        console.log("[POST /parents] Emitting socket events...");
        req.io.emit('updateDashboard');
    } else {
        console.warn('[POST /parents] Socket.IO instance not found.');
    }

    // 9. Populate and send response
     const newParentPopulated = await prisma.parent.findUnique({
         where: { id: result.newParent.id },
         include: { student: { select: { studentid: true, first_name: true, father_name: true, last_name: true, class: { select: { class_name: true } } } } }
     });

     const formattedParent = {
         ...newParentPopulated,
         id: newParentPopulated.id,
         studentId: {
             id: newParentPopulated.student.studentid,
             name: getFullName(newParentPopulated.student),
             class: newParentPopulated.student.class.class_name
         }
     };

    res.status(201).json(formattedParent);

  } catch (err) {
    console.error("Error creating parent:", err);
     if (err.code === 'P2002') { // Prisma unique constraint error
        if (err.meta?.target?.includes('email')) { // User email unique
             return res.status(400).json({ msg: 'A user account with this email already exists.' });
        } else if (err.meta?.target?.includes('schoolId_email')) { // Parent email unique in school
             return res.status(400).json({ msg: 'A parent with this email already exists in this school.' });
        } else {
            return res.status(400).json({ msg: 'A unique constraint error occurred.' });
        }
     }
     // Transaction ke andar se custom error
     if (err.message.includes('student not found') || err.message.includes('already exists')) {
        return res.status(400).json({ msg: err.message });
     }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/parents/:id (Parent's Prisma ID)
// @desc    Update a parent
// @access  Private (Admin)
router.put('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role Check Admin
    const parentIdInt = parseInt(req.params.id);
    const { studentId, name, contactNumber, occupation } = req.body;
    const schoolId = req.user.schoolId;

    if (isNaN(parentIdInt)) {
        return res.status(400).json({ msg: 'Invalid Parent ID format.' });
    }

    try {
        // Prepare update data
        const updateData = {};
        if (name) updateData.name = name;
        if (contactNumber) updateData.contactNumber = contactNumber;
        if (occupation) updateData.occupation = occupation;

        // Agar studentId badal raha hai toh naye student ki ID (Int) daalein
        const studentIdInt = parseInt(studentId);
         if (studentIdInt) {
            const studentExists = await prisma.students.findUnique({
                 where: { studentid: studentIdInt, schoolId: schoolId }
            });
            if (!studentExists) {
                return res.status(404).json({ msg: 'New student selected not found in your school.' });
            }
            updateData.studentId = studentIdInt;
         }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ msg: 'No fields provided for update.' });
        }

        // --- Prisma Transaction --- (User name bhi update karna hai)
        const updatedParent = await prisma.$transaction(async (tx) => {
            // 1. Parent ko update karein
            const parent = await tx.parent.update({
                where: { id: parentIdInt, schoolId: schoolId }, // School check
                data: updateData,
                include: { // Response ke liye student data fetch karein
                     student: { select: { studentid: true, first_name: true, father_name: true, last_name: true, class: { select: { class_name: true } } } }
                }
            });

            // 2. Agar naam update hua hai aur User linked hai, toh User ka naam bhi update karein
            if (updateData.name && parent.userId) {
                 try {
                     await tx.user.update({
                         where: { id: parent.userId, schoolId: schoolId }, // School check
                         data: { name: updateData.name }
                     });
                     console.log(`[PUT /parents] Updated linked User name for parent ID: ${parentIdInt}`);
                 } catch (userUpdateError) {
                      if (userUpdateError.code !== 'P2025') { // Ignore "Not Found"
                         console.error(`[PUT /parents] Error updating linked User name:`, userUpdateError);
                         // Don't rollback
                      } else {
                          console.warn(`[PUT /parents] Linked User ${parent.userId} not found during name update.`);
                      }
                 }
            }
            return parent;
        }); // --- Transaction Khatam ---

        // Format response
        const formattedParent = {
            ...updatedParent,
            id: updatedParent.id,
            studentId: {
                id: updatedParent.student.studentid,
                name: getFullName(updatedParent.student),
                class: updatedParent.student.class.class_name
            }
        };

        res.json(formattedParent);
    } catch (err) {
        console.error("Error updating parent:", err);
         if (err.code === 'P2025') { // Record to update not found
            return res.status(404).json({ msg: 'Parent not found or access denied.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/parents/:id (Parent's Prisma ID)
// @desc    Delete a parent AND their User account
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role Check Admin
  try {
    const parentIdInt = parseInt(req.params.id);
    if (isNaN(parentIdInt)) {
        return res.status(400).json({ msg: 'Invalid Parent ID format.' });
    }

    const parentToDelete = await prisma.parent.findUnique({
        where: { id: parentIdInt, schoolId: req.user.schoolId } // School check
    });
    if (!parentToDelete) return res.status(404).json({ msg: 'Parent not found or access denied.' });

    const linkedUserId = parentToDelete.userId;

    // --- Prisma Transaction ---
    await prisma.$transaction(async (tx) => {
        // IMPORTANT: Agar Parent delete karne se pehle kuch aur delete karna hai (jo Parent par depend karta hai), toh woh yahaan karein.

        // 1. Parent record delete karein
        await tx.parent.delete({
            where: { id: parentIdInt }
        });
        console.log(`[DELETE /parents] Deleted parent document: ${parentIdInt}`);

        // 2. Agar User linked hai, toh User ko delete karein
        if (linkedUserId) {
             try {
                 await tx.user.delete({
                     where: { id: linkedUserId, schoolId: req.user.schoolId } // School check
                 });
                 console.log(`[DELETE /parents] Deleted linked user account: ${linkedUserId}`);
             } catch (userDeleteError) {
                  if (userDeleteError.code !== 'P2025') { // Ignore "Not Found"
                     console.error(`[DELETE /parents] Error deleting user ${linkedUserId}:`, userDeleteError);
                     throw userDeleteError; // Rollback transaction
                  } else {
                      console.log(`[DELETE /parents] Linked user ${linkedUserId} not found.`);
                  }
             }
        }
    }); // --- Transaction Khatam ---

    // Socket emit (Same)
    if (req.io) {
        console.log("[DELETE /parents] Emitting socket events...");
        req.io.emit('updateDashboard');
    } else {
         console.warn('[DELETE /parents] Socket.IO instance not found.');
    }

    res.json({ msg: 'Parent removed successfully' });
  } catch (err) {
    console.error("Error deleting parent:", err);
    if (err.code === 'P2025') { // Record to delete not found
        return res.status(404).json({ msg: 'Parent not found or access denied.' });
    }
    // Foreign key constraint
    if (err.code === 'P2003' || err.code === 'P2014') {
        return res.status(400).json({ msg: 'Cannot delete parent. They might be linked to other records.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
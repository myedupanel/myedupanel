// backend/routes/students.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma'); // Prisma client import karein
const bcrypt = require('bcryptjs'); // Password hashing ke liye
const generatePassword = require('generate-password'); // Temp password ke liye
const sendEmail = require('../utils/sendEmail');
const { authMiddleware, authorize } = require('../middleware/authMiddleware'); // Updated middleware

// Helper: Get Full Name
const getFullName = (student) => {
  return [student?.first_name, student?.father_name, student?.last_name].filter(Boolean).join(' ');
}

// @route   POST /api/students
// @desc    Add a new student AND optionally create their User account
// @access  Private (Admin only)
// NOTE: Yeh function humne pehle hi controller mein update kar diya tha.
// Ab hum route ko seedha controller function se link karenge.
const studentController = require('../controllers/studentController'); // Controller import karein
router.post('/', [authMiddleware, authorize('Admin')], studentController.addStudentsInBulk); // Controller function use karein

// @route   GET /api/students
// @desc    Get students for the user's school
// @access  Private (Admin, Teacher)
router.get('/', [authMiddleware, authorize('Admin', 'Teacher')], studentController.getAllStudents); // Controller function use karein

// @route   GET /api/students/classes
// @desc    Get unique class names for the school
// @access  Private
router.get('/classes', [authMiddleware], async (req, res) => {
    // Yeh logic controller mein nahi tha, isliye yahin rakhenge
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) {
            return res.status(400).json({ msg: 'Invalid or missing school ID.' });
        }
        
        const classes = await prisma.classes.findMany({
            where: { schoolId },
            select: { class_name: true },
            distinct: ['class_name'],
            orderBy: { class_name: 'asc' }
        });
        
        const classNames = classes.map(c => c.class_name);
        res.json(classNames);
    } catch (err) {
        console.error("Error fetching distinct classes:", err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/students/search
// @desc    Search students by name within the user's school
// @access  Private
router.get('/search', authMiddleware, async (req, res) => {
    // Yeh logic controller mein nahi tha, isliye yahin rakhenge
     try {
        const schoolId = req.user.schoolId;
        const studentName = req.query.name || '';
        
        if (!schoolId) return res.status(400).json({ msg: 'School information not found.' });
        if (studentName.length < 2) return res.json([]);

        const students = await prisma.students.findMany({
            where: {
                schoolId: schoolId,
                OR: [
                  { first_name: { contains: studentName, mode: 'insensitive' } },
                  { father_name: { contains: studentName, mode: 'insensitive' } },
                  { last_name: { contains: studentName, mode: 'insensitive' } },
                ]
            },
            select: {
                studentid: true,
                first_name: true,
                father_name: true,
                last_name: true,
                class: { select: { class_name: true } }
            },
            take: 10
        });

        const formattedStudents = students.map(s => ({
            id: s.studentid,
            name: getFullName(s),
            class: s.class.class_name
        }));

        res.json(formattedStudents);
    } catch (error) {
        console.error("Error searching students:", error.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/students/:id
// @desc    Get a single student by their Prisma ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
    // Yeh logic controller mein nahi tha, isliye yahin rakhenge
    try {
        const studentIdInt = parseInt(req.params.id);
        if (isNaN(studentIdInt)) {
             return res.status(400).json({ msg: 'Invalid student ID format.' });
        }
        
        const student = await prisma.students.findUnique({
            where: { 
                studentid: studentIdInt,
                schoolId: req.user.schoolId // School check
            },
            include: { 
                class: { select: { class_name: true }}
            }
        });
        
        if (!student) return res.status(404).json({ msg: 'Student not found or access denied.' });
        
        const formattedStudent = {
            ...student,
            id: student.studentid,
            name: getFullName(student),
            class: student.class.class_name,
            rollNo: student.roll_number,
            parentName: student.father_name,
            parentContact: student.guardian_contact
        };

        res.json(formattedStudent);
    } catch (error) {
        console.error("Error fetching single student:", error.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/students/:id
// @desc    Update a student's details
// @access  Private (Admin only)
router.put('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role check Admin
    // Yeh logic complex hai aur controller mein nahi tha, isliye yahin rakhenge
     try {
        const studentIdInt = parseInt(req.params.id);
        if (isNaN(studentIdInt)) {
            return res.status(400).json({ msg: 'Invalid student ID format.' });
        }
        
        const student = await prisma.students.findUnique({
             where: { studentid: studentIdInt, schoolId: req.user.schoolId }
        });
        if (!student) return res.status(404).json({ message: 'Student not found or access denied.' });

        const updateData = {};
        const body = req.body;
        const currentEmail = student.email; // Purana email save karein
        
        // Map frontend fields to Prisma fields
        if (body.first_name) updateData.first_name = body.first_name;
        if (body.father_name) updateData.father_name = body.father_name;
        if (body.last_name) updateData.last_name = body.last_name;
        if (body.rollNo) updateData.roll_number = body.rollNo;
        if (body.parentName) updateData.father_name = body.parentName; // Map parentName to father_name
        if (body.parentContact) updateData.guardian_contact = body.parentContact; // Map parentContact
        if (body.dob) updateData.dob = new Date(body.dob);
        if (body.address) updateData.address = body.address;
        if (body.email) updateData.email = body.email.toLowerCase();
        if (body.mother_name) updateData.mother_name = body.mother_name;
        // ... (Baaki saare fields yahaan map karein) ...
        
        // Agar class update ho rahi hai
        if (body.class && body.class !== student.class?.class_name) { 
            const classRecord = await prisma.classes.findUnique({
                where: { schoolId_class_name: { schoolId: req.user.schoolId, class_name: body.class } }
            });
            if (classRecord) {
                updateData.classId = classRecord.classid;
            } else {
                 console.warn(`Class '${body.class}' not found during student update.`);
                 // Aap chahein toh yahaan error de sakte hain
                 // return res.status(400).json({ msg: `Class '${body.class}' not found.` });
            }
        }

        const updatedStudent = await prisma.students.update({
            where: { studentid: studentIdInt },
            data: updateData,
            include: { class: { select: { class_name: true } } }
        });

        // Linked User ko update karein (agar zaroori ho)
        if (updatedStudent.userId && (updateData.first_name || updateData.last_name || updateData.email)) {
            const userUpdatePayload = {};
            if (updateData.first_name || updateData.last_name) {
                userUpdatePayload.name = getFullName(updatedStudent); // Updated full name
            }
            // Email tabhi update karein jab woh badla ho
            if (updateData.email && updateData.email !== currentEmail) { 
                userUpdatePayload.email = updateData.email;
            }

            if (Object.keys(userUpdatePayload).length > 0) {
                 try {
                     await prisma.user.update({
                        where: { id: updatedStudent.userId, schoolId: req.user.schoolId },
                        data: userUpdatePayload
                     });
                     console.log(`[PUT /students/:id] Updated corresponding User: ${updatedStudent.userId}`);
                 } catch (userUpdateError) {
                      if (userUpdateError.code === 'P2002' && userUpdateError.meta?.target?.includes('email')) {
                         console.error(`[PUT /students/:id] Error updating User: Email '${userUpdatePayload.email}' already exists.`);
                         // Frontend ko warning bhejein
                         return res.status(400).json({ msg: `Student updated, but linked user email '${userUpdatePayload.email}' is already in use.` });
                      } else {
                         console.error(`[PUT /students/:id] Error updating linked User:`, userUpdateError);
                         // User update fail hua, lekin student update ho gaya
                      }
                 }
             }
        }
        
        const formattedStudent = {
            ...updatedStudent,
            id: updatedStudent.studentid,
            name: getFullName(updatedStudent),
            class: updatedStudent.class.class_name,
            rollNo: updatedStudent.roll_number,
            parentName: updatedStudent.father_name,
            parentContact: updatedStudent.guardian_contact
        };

        if (req.io) {
            req.io.emit('updateDashboard');
            req.io.emit('student_updated', formattedStudent);
        }
        res.json({ message: 'Student details updated successfully', student: formattedStudent });

    } catch (err) {
        console.error("Error updating student:", err.message);
        if (err.code === 'P2025') {
            return res.status(404).json({ msg: 'Student not found or access denied.' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   DELETE /api/students/:id
// @desc    Delete a student (AND their User account if linked)
// @access  Private (Admin only)
router.delete('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role check Admin
    // Yeh logic controller mein nahi tha, isliye yahin rakhenge
    try {
        const studentIdInt = parseInt(req.params.id);
        if (isNaN(studentIdInt)) {
            return res.status(400).json({ msg: 'Invalid student ID format.' });
        }
        
        const student = await prisma.students.findUnique({
            where: { studentid: studentIdInt, schoolId: req.user.schoolId }
        });
        if (!student) return res.status(404).json({ message: 'Student not found or access denied.' });

        const linkedUserId = student.userId;

        await prisma.$transaction(async (tx) => {
            // IMPORTANT: Pehle woh records delete karein jo student par depend karte hain
            // Example: Agar FeeRecord/Transaction mein studentId zaroori hai aur ON DELETE CASCADE nahi hai
            // await tx.transaction.deleteMany({ where: { studentId: studentIdInt }});
            // await tx.feeRecord.deleteMany({ where: { studentId: studentIdInt }});
            // Abhi ke schema mein cascade nahi hai, isliye yeh zaroori ho sakta hai
            // WARN: Isse student ka poora fee history delete ho jayega! Carefully consider this.
            // Agar history rakhni hai, toh student delete nahi karna chahiye, ya schema mein `onDelete: SetNull` use karein.
            
            // Ab student delete karein
            await tx.students.delete({
                where: { studentid: studentIdInt }
            });
            console.log(`[DELETE /students] Deleted student document: ${studentIdInt}`);

            if (linkedUserId) {
                try {
                    await tx.user.delete({
                        where: { id: linkedUserId, schoolId: req.user.schoolId }
                    });
                    console.log(`[DELETE /students] Deleted linked user account: ${linkedUserId}`);
                } catch (userDeleteError) {
                     if (userDeleteError.code !== 'P2025') { // Ignore "Not Found" error
                         console.error(`[DELETE /students] Error deleting user ${linkedUserId}:`, userDeleteError);
                         throw userDeleteError; // Rollback transaction
                     } else {
                          console.log(`[DELETE /students] Linked user ${linkedUserId} not found.`);
                     }
                }
            }
        });

        if (req.io) {
            req.io.emit('updateDashboard');
            req.io.emit('student_deleted', { id: studentIdInt });
        }

        res.json({ message: 'Student removed successfully' });
    } catch (err) {
        console.error("Error deleting student:", err.message);
        if (err.code === 'P2025') {
             return res.status(404).json({ msg: 'Student not found or access denied.' });
        }
        // Prisma Foreign Key constraint error (agar student delete nahi ho sakta)
        if (err.code === 'P2003' || err.code === 'P2014') { 
            console.error("Cannot delete student due to related records (e.g., fee history).")
            return res.status(400).json({ msg: 'Cannot delete student. They have associated fee records or transactions. Please resolve these first.' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
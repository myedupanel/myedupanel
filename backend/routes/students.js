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

// Controller se functions import karein
const { 
  addSingleStudent, 
  addStudentsInBulk, 
  getAllStudents 
} = require('../controllers/studentController'); 

// --- Primary Routes (Controller se) ---

// POST /api/students (Add single student)
router.post('/', [authMiddleware, authorize('Admin')], addSingleStudent);

// POST /api/students/bulk (Add bulk students)
router.post('/bulk', [authMiddleware, authorize('Admin')], addStudentsInBulk);

// GET /api/students (Get all students)
router.get('/', [authMiddleware, authorize('Admin', 'Teacher')], getAllStudents); 

// --- Baaki Routes (Jo pehle se file mein the) ---

// GET /api/students/classes
router.get('/classes', [authMiddleware], async (req, res) => {
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


// GET /api/students/search
router.get('/search', authMiddleware, async (req, res) => {
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
            // --- YEH HAI AAPKA FIX 1 ---
            class: s.class?.class_name || 'N/A' // 's.class.class_name' ko 's.class?.class_name' kiya
        }));

        res.json(formattedStudents);
    } catch (error) {
        console.error("Error searching students:", error.message);
        res.status(500).send("Server Error");
    }
});

// GET /api/students/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const studentIdInt = parseInt(req.params.id);
        if (isNaN(studentIdInt)) {
             return res.status(400).json({ msg: 'Invalid student ID format.' });
        }
        
        const student = await prisma.students.findUnique({
            where: { 
                studentid: studentIdInt,
                schoolId: req.user.schoolId 
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
            // --- YEH HAI AAPKA FIX 2 ---
            class: student.class?.class_name || 'N/A', // 'student.class.class_name' ko 'student.class?.class_name' kiya
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

// PUT /api/students/:id
router.put('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { 
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
        const currentEmail = student.email; 
        
        if (body.first_name) updateData.first_name = body.first_name;
        if (body.father_name) updateData.father_name = body.father_name;
        if (body.last_name) updateData.last_name = body.last_name;
        if (body.rollNo) updateData.roll_number = body.rollNo;
        if (body.parentName) updateData.father_name = body.parentName; 
        if (body.parentContact) updateData.guardian_contact = body.parentContact; 
        if (body.dob) updateData.dob = new Date(body.dob);
        if (body.address) updateData.address = body.address;
        if (body.email) updateData.email = body.email.toLowerCase();
        if (body.mother_name) updateData.mother_name = body.mother_name;
        
        if (body.class && body.class !== student.class?.class_name) { 
            const classRecord = await prisma.classes.findUnique({
                where: { schoolId_class_name: { schoolId: req.user.schoolId, class_name: body.class } }
            });
            if (classRecord) {
                updateData.classid = classRecord.classid; // 'classId' ko 'classid' kiya
            } else {
                 console.warn(`Class '${body.class}' not found during student update.`);
            }
        }

        const updatedStudent = await prisma.students.update({
            where: { studentid: studentIdInt },
            data: updateData,
            include: { class: { select: { class_name: true } } }
        });

        if (updatedStudent.userId && (updateData.first_name || updateData.last_name || updateData.email)) {
            const userUpdatePayload = {};
            if (updateData.first_name || updateData.last_name) {
                userUpdatePayload.name = getFullName(updatedStudent); 
            }
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
                         return res.status(400).json({ msg: `Student updated, but linked user email '${userUpdatePayload.email}' is already in use.` });
                      } else {
                         console.error(`[PUT /students/:id] Error updating linked User:`, userUpdateError);
                      }
                 }
             }
        }
        
        const formattedStudent = {
            ...updatedStudent,
            id: updatedStudent.studentid,
            name: getFullName(updatedStudent),
            // --- YEH HAI AAPKA FIX 3 ---
            class: updatedStudent.class?.class_name || 'N/A', // 'updatedStudent.class.class_name' ko 'updatedStudent.class?.class_name' kiya
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


// DELETE /api/students/:id
router.delete('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { 
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
                     if (userDeleteError.code !== 'P2025') { 
                         console.error(`[DELETE /students] Error deleting user ${linkedUserId}:`, userDeleteError);
                         throw userDeleteError; 
                     } else {
                          console.log(`[DELETE /students] Linked user ${linkedUserId} not found.`);
                     }
                }
            }
        });

        if (req.io) {
            req.io.emit('updateDashboard');
            // FIX: 'id' ko 'studentid' kiya
            req.io.emit('student_deleted', { id: studentIdInt, schoolId: req.user.schoolId });
        }

        res.json({ message: 'Student removed successfully' });
    } catch (err) {
        console.error("Error deleting student:", err.message);
        if (err.code === 'P2025') {
             return res.status(404).json({ msg: 'Student not found or access denied.' });
        }
        if (err.code === 'P2003' || err.code === 'P2014') { 
            console.error("Cannot delete student due to related records (e.g., fee history).")
            return res.status(400).json({ msg: 'Cannot delete student. They have associated fee records or transactions. Please resolve these first.' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
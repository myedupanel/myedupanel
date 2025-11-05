// backend/routes/students.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma'); 
const bcrypt = require('bcryptjs'); 
const generatePassword = require('generate-password'); 
const sendEmail = require('../utils/sendEmail');
const { authMiddleware, authorize } = require('../middleware/authMiddleware'); 

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

// --- Routes using Controller ---
router.post('/', [authMiddleware, authorize('Admin')], addSingleStudent);
router.post('/bulk', [authMiddleware, authorize('Admin')], addStudentsInBulk);
router.get('/', [authMiddleware, authorize('Admin', 'Teacher')], getAllStudents);

// @route   GET /api/students/classes
// (Yeh code pehle se sahi tha)
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


// @route   GET /api/students/search
// --- YAHAN FIX KIYA GAYA HAI ---
router.get('/search', authMiddleware, async (req, res) => {
     try {
        const schoolId = req.user.schoolId;
        const studentName = req.query.name || '';
        
        if (!schoolId) return res.status(400).json({ msg: 'School information not found.' });
        if (studentName.length < 2) return res.json([]);

        const students = await prisma.students.findMany({
            where: {
                schoolId: schoolId,
                // --- FIX: 'mode: "insensitive"' ko hata diya gaya hai ---
                OR: [
                  { first_name: { contains: studentName } }, 
                  { father_name: { contains: studentName } },
                  { last_name: { contains: studentName } },
                ]
            },
            // Select waala part bilkul perfect hai, use change nahi kiya
            select: {
                studentid: true,
                first_name: true,
                father_name: true,
                last_name: true,
                class: { select: { class_name: true } },
                
                // LC Certificate ke liye zaroori fields
                dob: true,
                roll_number: true,    // Point 1 (Sr. No)
                uid_number: true,     // Point 2 (Aadhaar)
                mother_name: true,    // Point 4
                nationality: true,    // Point 5
                caste: true,          // Point 5
                birth_place: true,    // Point 6
                previous_school: true, // Point 9
                admission_date: true, // Point 10
            },
            take: 10
        });

        // Format waala part bhi bilkul sahi hai
        const formattedStudents = students.map(s => ({
            id: s.studentid.toString(), 
            name: getFullName(s),
            class: s.class?.class_name || 'N/A',
            
            // Auto-fill data (Student interface se match karta hua)
            dob: s.dob ? s.dob.toISOString().split('T')[0] : undefined,
            studentId: s.roll_number || '',
            aadhaarNo: s.uid_number || '',
            motherName: s.mother_name || '',
            nationality: s.nationality || 'Indian',
            caste: s.caste || '',
            birthPlace: s.birth_place || '',
            previousSchool: s.previous_school || '',
            dateOfAdmission: s.admission_date ? s.admission_date.toISOString().split('T')[0] : undefined,
        }));

        res.json(formattedStudents);
    } catch (error) {
        // --- FIX: Ab yeh error nahi aana chahiye ---
        console.error("Error searching students:", error.message);
        res.status(500).send("Server Error");
    }
});
// --- FIX YAHAN KHATAM HUA ---


// @route   GET /api/students/:id
// (Yeh code pehle se sahi tha)
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
                class: true 
            }
        });
        
        if (!student) return res.status(404).json({ msg: 'Student not found or access denied.' });
        
        const formattedStudent = {
            ...student,
            id: student.studentid,
            name: getFullName(student),
            class: student.class?.class_name || 'N/A', 
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
// (Yeh code pehle se sahi tha)
router.put('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { 
     try {
        const studentIdInt = parseInt(req.params.id);
        if (isNaN(studentIdInt)) {
            return res.status(400).json({ msg: 'Invalid student ID format.' });
        }
        
        const student = await prisma.students.findUnique({
             where: { studentid: studentIdInt, schoolId: req.user.schoolId },
             include: { class: true } 
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
                updateData.classid = classRecord.classid;
            } else {
                 console.warn(`Class '${body.class}' not found during student update.`);
            }
        }

        const updatedStudent = await prisma.students.update({
            where: { studentid: studentIdInt },
            data: updateData,
            include: { class: true } 
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
            class: updatedStudent.class?.class_name || 'N/A', 
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
// (Yeh code pehle se sahi tha)
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
            req.io.emit('student_deleted', { id: studentIdInt });
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
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Helper function (students ke liye)
const getStudentFullName = (student) => {
  if (!student) return 'N/A';
  return [student.first_name, student.father_name, student.last_name].filter(Boolean).join(' ');
}

// @route   POST /api/attendance
// @desc    Take or update STUDENT attendance
// (Yeh code pehle se sahi tha, koi badlaav nahi)
router.post('/', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => {
  const { date, classId, attendanceData } = req.body;
  const schoolId = req.user.schoolId;

  if (!date || !classId || !attendanceData) {
    return res.status(400).json({ msg: 'Date, ClassID, and Attendance Data are required.' });
  }

  try {
    const classIdInt = parseInt(classId);
    if (isNaN(classIdInt)) {
        return res.status(400).json({ msg: 'Invalid Class ID format.' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0); 
    const studentIds = Object.keys(attendanceData).map(id => parseInt(id));

    const transactions = studentIds.map(studentId => {
      const status = attendanceData[studentId.toString()];
      if (status === 'Unmarked') {
          return null;
      }
      return prisma.attendance.upsert({
        where: { studentId_date: { studentId: studentId, date: attendanceDate } },
        create: { date: attendanceDate, status: status, studentId: studentId, classId: classIdInt, schoolId: schoolId },
        update: { status: status, classId: classIdInt }
      });
    });
    
    const validTransactions = transactions.filter(t => t !== null);
    await prisma.$transaction(validTransactions);

    res.status(200).json({ msg: 'Student attendance saved successfully.' });

  } catch (error) {
    console.error("Error saving student attendance:", error);
    if (error.code === 'P2003') { 
        return res.status(400).json({ msg: 'Error: Invalid studentId, classId, or schoolId.' });
    }
    res.status(500).send('Server Error');
  }
});

// ===============================================
// --- STAFF ATTENDANCE ROUTES ---
// (Yeh code pehle se sahi tha, koi badlaav nahi)
// ===============================================

// @route   POST /api/attendance/staff
// @desc    Take or update STAFF attendance
router.post('/staff', [authMiddleware, authorize('Admin')], async (req, res) => {
  const { date, attendanceData } = req.body; 
  const schoolId = req.user.schoolId;

  if (!date || !attendanceData) {
    return res.status(400).json({ msg: 'Date and Attendance Data are required.' });
  }

  try {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0); 
    const userIds = Object.keys(attendanceData).map(id => parseInt(id));

    const transactions = userIds.map(userId => {
      const status = attendanceData[userId.toString()];
      if (status === 'Unmarked') {
          return null;
      }
      return prisma.staffAttendance.upsert({
        where: { userId_date: { userId: userId, date: attendanceDate } },
        create: { date: attendanceDate, status: status, userId: userId, schoolId: schoolId },
        update: { status: status }
      });
    });
    
    const validTransactions = transactions.filter(t => t !== null);
    await prisma.$transaction(validTransactions);

    res.status(200).json({ msg: 'Staff attendance saved successfully.' });

  } catch (error) {
    console.error("Error saving staff attendance:", error);
    if (error.code === 'P2003') {
        return res.status(400).json({ msg: 'Error: Invalid userId or schoolId.' });
    }
    res.status(500).send('Server Error');
  }
});


// @route   GET /api/attendance/staff
// @desc    Get STAFF attendance for a specific date
// (Yeh code pehle se sahi tha, koi badlaav nahi)
router.get('/staff', [authMiddleware, authorize('Admin')], async (req, res) => {
  const { date } = req.query;
  const schoolId = req.user.schoolId;

  if (!date) {
    return res.status(400).json({ msg: 'Date is required.' });
  }

  try {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const attendanceRecords = await prisma.staffAttendance.findMany({
      where: { schoolId: schoolId, date: attendanceDate },
      select: { userId: true, status: true }
    });

    const attendanceMap = attendanceRecords.reduce((acc, record) => {
      acc[record.userId.toString()] = record.status;
      return acc;
    }, {});

    res.status(200).json(attendanceMap);

  } catch (error) {
    console.error("Error fetching staff attendance:", error);
    res.status(500).send('Server Error');
  }
});


// --- YEH NAYA 'REPORT' ROUTE ADD KIYA GAYA HAI ---

// @route   GET /api/attendance/report
// @desc    Generate STUDENT or STAFF attendance report
// @access  Private (Admin)
router.get('/report', [authMiddleware, authorize('Admin')], async (req, res) => {
  const { reportFor, groupId, role, startDate, endDate } = req.query;
  const schoolId = req.user.schoolId;

  if (!reportFor || !startDate || !endDate) {
    return res.status(400).json({ msg: 'Report type, start date, and end date are required.' });
  }

  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of the day

    let finalReport = [];

    if (reportFor === 'student') {
      // --- STUDENT REPORT LOGIC ---
      const classIdInt = parseInt(groupId);
      if (isNaN(classIdInt)) {
        return res.status(400).json({ msg: 'Invalid Class ID.' });
      }

      // 1. Uss class ke saare students nikalo
      const students = await prisma.students.findMany({
        where: { schoolId: schoolId, classid: classIdInt },
        // 2. Har student ke saath, unki attendance bhi nikalo (sirf date range ke andar ki)
        include: {
          attendances: {
            where: {
              date: { gte: start, lte: end }
            }
          }
        }
      });

      // 3. Data ko format karo
      finalReport = students.map(student => {
        const present = student.attendances.filter(a => a.status === 'Present').length;
        const absent = student.attendances.filter(a => a.status === 'Absent').length;
        const leave = student.attendances.filter(a => a.status === 'Leave').length;
        return {
          name: getStudentFullName(student),
          present,
          absent,
          leave,
          total: present + absent + leave
        };
      });

    } else if (reportFor === 'staff') {
      // --- STAFF REPORT LOGIC ---
      if (!role) {
        return res.status(400).json({ msg: 'Role is required for staff report.' });
      }

      // 1. Uss role ke saare staff (Users) nikalo
      const staffMembers = await prisma.user.findMany({
        where: { 
          schoolId: schoolId, 
          role: role // Filter by role
        },
        // 2. Har staff ke saath, unki attendance nikalo (sirf date range ke andar ki)
        include: {
          staffAttendances: {
            where: {
              date: { gte: start, lte: end }
            }
          }
        }
      });
      
      // 3. Data ko format karo
      finalReport = staffMembers.map(staff => {
        const present = staff.staffAttendances.filter(a => a.status === 'Present').length;
        const absent = staff.staffAttendances.filter(a => a.status === 'Absent').length;
        const leave = staff.staffAttendances.filter(a => a.status === 'Leave').length;
        return {
          name: staff.name, // User model mein 'name' field hai
          present,
          absent,
          leave,
          total: present + absent + leave
        };
      });
    }

    res.status(200).json(finalReport);

  } catch (error) {
    console.error("Error generating attendance report:", error);
    res.status(500).send('Server Error');
  }
});
// --- NAYA 'REPORT' ROUTE YAHAN KHATAM HOTA HAI ---

module.exports = router;
// backend/routes/dashboard.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma'); // Mongoose ki jagah Prisma

// @route   GET /api/dashboard/stats
// @desc    Dashboard ke liye saare stats fetch karein
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // 1. SchoolId ko req.user.schoolId se lein (jaisa hamare naye authMiddleware mein hai)
    const schoolId = req.user.schoolId; 

    // Safety Check: Ensure schoolId exists
    if (!schoolId) {
        return res.status(400).json({ msg: 'Invalid School ID' });
    }
    
    // Mongoose ObjectId check ki zaroorat nahi hai
    // const schoolObjectId = new mongoose.Types.ObjectId(schoolId); // --- YEH HATA DIYA ---

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      studentsByClass
    ] = await Promise.all([
      // 2. Mongoose .countDocuments ko Prisma .count se badla
      prisma.students.count({ where: { schoolId: schoolId } }),
      prisma.teachers.count({ where: { schoolId: schoolId } }),
      prisma.classes.count({ where: { schoolId: schoolId } }),
      
      // 3. Mongoose .aggregate ko behtar Prisma .findMany + _count se badla
      prisma.classes.findMany({
        where: { schoolId: schoolId },
        select: {
          class_name: true,
          _count: { // 'students' relation ko count karein
            select: { students: true }
          }
        },
        orderBy: { class_name: 'asc' }
      })
    ]);
    
    // Assemble data into the format the frontend needs
    const responseData = {
      stats: [
        { title: "Total Students", value: totalStudents.toString() },
        { title: "Total Teachers", value: totalTeachers.toString() },
        { title: "Monthly Revenue", value: "₹0" }, // Placeholder
        { title: "Total Parents", value: "0" },    // Placeholder
        { title: "Total Staff", value: "0" },      // Placeholder
        { title: "Total Classes", value: totalClasses.toString() }
      ],
      // 4. Data ko naye query result ke hisaab se map karein
      admissionData: studentsByClass.map(item => ({ 
        name: item.class_name, // 'class_name' use karein
        admissions: item._count.students // '_count.students' use karein
      })),
      recentPayments: [] // Placeholder
    };

    res.json(responseData);

  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
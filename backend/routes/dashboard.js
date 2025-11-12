// backend/routes/dashboard.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateAcademicYear } = require('../middleware/academicYearMiddleware');
const prisma = require('../config/prisma'); // Mongoose ki jagah Prisma

// @route   GET /api/dashboard/stats
// @desc    Dashboard ke liye saare stats fetch karein (Ab Sahi Logic Ke Saath)
router.get('/stats', [authMiddleware, validateAcademicYear], async (req, res) => {
  try {
    // 1. SchoolId ko req.user.schoolId se lein (No Change)
    const schoolId = req.user.schoolId; 

    if (!schoolId) {
        return res.status(400).json({ msg: 'Invalid School ID' });
    }
    
    // NAYA: Academic year ID ke basis par filter karein
    const academicYearWhere = { schoolId: schoolId, academicYearId: req.academicYearId };
    
    // --- FIX: Hum Promise.all ko 'admin.js' waale sahi logic se update karenge ---
    const staffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'Staff']; // admin.js se copy kiya

    const [
      totalStudents,
      totalTeachers,
      totalParents,     // <-- Naya add kiya
      totalStaff,       // <-- Naya add kiya
      totalClasses,
      admissionsDataRaw, // <-- YEH HAI ADMISSION CHART KE LIYE
      classCountsRaw     // <-- YEH HAI 'Students by Class' CHART KE LIYE
    ] = await Promise.all([
      // Kadam 1: Saare Counters (admin.js se copy kiye) - UPDATED to filter by academic year
      prisma.students.count({ where: academicYearWhere }), // Total Students (Sahi table se)
      prisma.teachers.count({ where: academicYearWhere }), // Total Teachers - UPDATED to filter by academic year
      prisma.parent.count({ where: { schoolId: schoolId } }), // Total Parents
      prisma.user.count({ where: { role: { in: staffRoles }, schoolId: schoolId } }), // Total Staff
      prisma.classes.count({ where: { schoolId: schoolId } }), // Total Classes

      // Kadam 2: Admission Chart Aggregation (admin.js se copy kiya) - UPDATED to filter by academic year
      prisma.students.groupBy({
          by: ['admission_date'], // 'admission_date' se group karein
          where: { 
              ...academicYearWhere, 
              admission_date: { not: null } // Sirf unhein ginein jinki date null nahi hai
          }, 
          _count: { studentid: true }, 
          orderBy: { admission_date: 'asc'}
      }),
      
      // Kadam 3: Class Counts Aggregation (admin.js se copy kiya) - UPDATED to filter by academic year
      prisma.students.groupBy({
          by: ['classid'],
          where: academicYearWhere,
          _count: { studentid: true }, 
      }),
    ]);
    // --- END FIX ---
    
    // --- FIX: Data ko process karne ka logic (admin.js se copy kiya) ---

    // 1. Admissions Data (Month-wise) Process Karein
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const admissionsMap = new Map(monthNames.map((name, index) => [index + 1, { name, admissions: 0 }]));
    
    admissionsDataRaw.forEach(item => {
        if (item.admission_date) {
             const month = item.admission_date.getMonth() + 1; // 1 (Jan) se 12 (Dec)
             if (admissionsMap.has(month)) {
                // Sahi count ko 'admissions' field mein add karein
                admissionsMap.get(month).admissions += item._count.studentid; 
             }
        }
    });
    const admissionsData = Array.from(admissionsMap.values()); // Yeh jayega "Student Admission" chart mein

    // 2. Class Counts Data Process Karein
    const classIds = classCountsRaw.map(item => item.classid).filter(id => id !== null); // null classids ko filter karein
    let studentsByClass = []; // Is variable ka naam 'studentsByClass' rakha
    if (classIds.length > 0) {
         const classesInfo = await prisma.classes.findMany({
             where: { classid: { in: classIds } },
             select: { classid: true, class_name: true }
         });
         const classInfoMap = new Map(classesInfo.map(c => [c.classid, c.class_name]));
         
         studentsByClass = classCountsRaw.map(item => ({
             name: classInfoMap.get(item.classid) || `Unknown`,
             Students: item._count.studentid // Chart 'Students' key expect kar raha hai
         })).sort((a, b) => a.name.localeCompare(b.name));
    }
    // --- END PROCESSING LOGIC ---

    // Assemble data into the format the frontend needs
    const responseData = {
      stats: [
        { title: "Total Students", value: totalStudents.toString() },
        { title: "Total Teachers", value: totalTeachers.toString() },
        { title: "Monthly Revenue", value: "₹0" }, // Placeholder
        { title: "Total Parents", value: totalParents.toString() }, // <-- Update kiya
        { title: "Total Staff", value: totalStaff.toString() },      // <-- Update kiya
        { title: "Total Classes", value: totalClasses.toString() }
      ],
      // --- FIX: Sahi data ko sahi field mein bhejein ---
      admissionData: admissionsData,  // <--- Monthly data
      studentsByClass: studentsByClass, // <--- Class-wise data (Naya field add kiya)
      // --- END FIX ---
      recentPayments: [] // Placeholder
    };

    res.json(responseData);

  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
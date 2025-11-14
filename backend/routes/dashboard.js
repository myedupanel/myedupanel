// backend/routes/dashboard.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateAcademicYear } = require('../middleware/academicYearMiddleware');
const prisma = require('../config/prisma'); // Mongoose ki jagah Prisma

// Add timeout middleware for dashboard requests
const timeoutMiddleware = (req, res, next) => {
  // Set a 15 second timeout for dashboard requests
  req.setTimeout(15000, () => {
    res.status(408).json({ error: 'Request timeout - dashboard data taking too long to load' });
  });
  next();
};

// @route   GET /api/dashboard/stats
// @desc    Dashboard ke liye saare stats fetch karein (Ab Sahi Logic Ke Saath)
router.get('/stats', [timeoutMiddleware, authMiddleware, validateAcademicYear], async (req, res) => {
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

    // --- Optimized Promise.all with timeout handling ---
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

    // 3. Recent Students (UPDATED to filter by academic year)
    const recentStudentsRaw = await prisma.students.findMany({ 
        where: academicYearWhere, 
        orderBy: { studentid: 'desc' }, 
        take: 5, 
        select: { 
            studentid: true, 
            first_name: true, 
            father_name: true, 
            last_name: true, 
            admission_date: true,
            class: { select: { class_name: true } } 
        }
    }); 
    
    // 4. Recent Teachers (UPDATED to filter by academic year)
    const recentTeachersRaw = await prisma.teachers.findMany({ 
        where: academicYearWhere, 
        orderBy: { teacher_dbid: 'desc' }, 
        take: 5, 
        select: { name: true, subject: true, teacher_dbid: true } 
    });

    // 5. Recent Parents (No Change)
    const recentParents = await prisma.parent.findMany({ where: { schoolId }, orderBy: { id: 'desc' }, take: 5, select: { name: true, id: true } }); 

    // 6. Recent Staff (No Change)
    const recentStaff = await prisma.user.findMany({ where: { role: { in: staffRoles }, schoolId }, orderBy: { id: 'desc' }, take: 5, select: { name: true, role: true, id: true } }); 

    // 7. Recent Paid Transactions (UPDATED to filter by academic year)
    const recentPaidTransactions = await prisma.transaction.findMany({
        where: {
            ...academicYearWhere,
            status: 'Success'
        },
        orderBy: { paymentDate: 'desc' },
        take: 5,
        select: {
            id: true,
            amountPaid: true,
            paymentDate: true,
            student: { select: { first_name: true, last_name: true } }
        }
    });

    // --- Aggregations for Charts (No Change) ---

    // Admission Chart Data Processing
    const admissionsData = admissionsDataRaw.map(item => ({
        name: item.admission_date ? new Date(item.admission_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Unknown',
        admissions: item._count.studentid
    }));

    // Class Chart Data Processing
    const classCounts = await Promise.all(classCountsRaw.map(async (item) => {
        const classInfo = await prisma.classes.findUnique({
            where: { classid: item.classid },
            select: { class_name: true }
        });
        return {
            name: classInfo?.class_name || `Class ${item.classid}`,
            count: item._count.studentid
        };
    }));

    // --- Revenue Calculation (UPDATED to filter by academic year) ---
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthlyRevenueRaw = await prisma.transaction.aggregate({
        _sum: { amountPaid: true }, 
        where: {
            ...academicYearWhere,
            status: 'Success', 
            paymentDate: { 
                gte: startOfMonth,
                lt: nextMonthStart
            }
        }
    });

    const currentMonthRevenue = monthlyRevenueRaw._sum.amountPaid || 0;
    const currentMonthName = startOfMonth.toLocaleDateString('en-IN', { month: 'long' });

    // --- Response Formatting (No Change) ---
    const formattedRecentFees = recentPaidTransactions.map(transaction => ({
        id: transaction.id,
        student: `${transaction.student.first_name} ${transaction.student.last_name}`,
        amount: `₹${transaction.amountPaid.toLocaleString('en-IN')}`,
        date: new Date(transaction.paymentDate).toLocaleDateString('en-IN')
    }));

    const response = {
        totalStudents,
        totalTeachers,
        totalParents,
        totalStaff,
        totalClasses,
        admissionsData,
        classCounts,
        recentStudents: recentStudentsRaw,
        recentTeachers: recentTeachersRaw,
        recentParents,
        recentStaff,
        recentFees: formattedRecentFees,
        currentMonthRevenue,
        currentMonthName
    };

    res.json(response);
  } catch (err) {
      console.error("[GET /dashboard/stats] Error:\n", err);
      // More specific error handling
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        return res.status(408).json({ error: 'Dashboard data request timed out. Please try again.' });
      }
      res.status(500).json({ error: 'Failed to load dashboard data. Please try again.' });
  }
});

module.exports = router;
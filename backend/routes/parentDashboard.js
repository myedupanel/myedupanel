// File: backend/routes/parentDashboard.js
// Parent-specific dashboard API routes with real-time data binding

const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { parentAuth, parentDataIsolation } = require('../middleware/parentMiddleware');

// Apply parent authentication middleware to all routes
router.use(parentAuth);
router.use(parentDataIsolation);

// Get Parent Dashboard Overview
router.get('/overview', async (req, res) => {
  try {
    const { studentId, schoolId } = req.parentFilters;

    // Fetch student data with related information
    const student = await prisma.students.findUnique({
      where: { 
        studentid: studentId,
        schoolId: schoolId
      },
      include: {
        class: true,
        attendances: {
          take: 30,
          orderBy: { date: 'desc' }
        },
        marks: {
          take: 20,
          orderBy: { assessmentId: 'desc' },
          include: {
            assessment: true
          }
        },
        feeRecords: {
          include: {
            template: true,
            transactions: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student data not found' });
    }

    // Calculate attendance statistics
    const totalDays = student.attendances.length;
    const presentDays = student.attendances.filter(a => a.status === 'Present').length;
    const absentDays = student.attendances.filter(a => a.status === 'Absent').length;
    const lateDays = student.attendances.filter(a => a.status === 'Late').length;
    
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Calculate academic performance
    const recentMarks = student.marks.slice(0, 10);
    const averagePercentage = recentMarks.length > 0 
      ? Math.round(recentMarks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / recentMarks.length)
      : 0;

    // Calculate fee statistics
    const totalFeeAmount = student.feeRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalPaid = student.feeRecords.reduce((sum, record) => sum + record.amountPaid, 0);
    const totalBalance = totalFeeAmount - totalPaid;
    const pendingFees = student.feeRecords.filter(record => record.balanceDue > 0);

    // Get upcoming events
    const today = new Date();
    const upcomingEvents = await prisma.event.findMany({
      where: {
        schoolId: schoolId,
        date: {
          gte: today
        }
      },
      orderBy: { date: 'asc' },
      take: 5
    });

    const dashboardData = {
      student: {
        id: student.studentid,
        name: `${student.first_name} ${student.last_name}`,
        rollNumber: student.roll_number,
        class: student.class?.class_name,
        admissionDate: student.admission_date
      },
      attendance: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        percentage: attendancePercentage,
        recentAttendance: student.attendances.slice(0, 7)
      },
      academics: {
        averagePercentage,
        recentMarks: recentMarks.map(mark => ({
          subject: mark.subject,
          marksObtained: mark.marksObtained,
          maxMarks: mark.maxMarks,
          percentage: mark.percentage,
          grade: mark.grade,
          examName: mark.assessment?.name,
          examDate: mark.assessment?.date
        })),
        totalSubjects: [...new Set(recentMarks.map(m => m.subject))].length
      },
      fees: {
        totalAmount: totalFeeAmount,
        totalPaid,
        totalBalance,
        pendingFees: pendingFees.length,
        recentTransactions: student.feeRecords
          .flatMap(record => record.transactions)
          .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
          .slice(0, 5)
      },
      upcomingEvents: upcomingEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        category: event.category
      }))
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Parent Dashboard Overview Error:', error.message);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Get Student Attendance History
router.get('/attendance/history', async (req, res) => {
  try {
    const { studentId, schoolId } = req.parentFilters;
    const { startDate, endDate, limit = 30 } = req.query;

    const whereClause = {
      studentId: studentId,
      schoolId: schoolId
    };

    // Add date filters if provided
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: parseInt(limit)
    });

    res.json(attendanceRecords);
  } catch (error) {
    console.error('Attendance History Error:', error.message);
    res.status(500).json({ message: 'Error fetching attendance history' });
  }
});

// Get Student Academic Performance
router.get('/academics/performance', async (req, res) => {
  try {
    const { studentId, schoolId } = req.parentFilters;
    const { subject, limit = 20 } = req.query;

    const whereClause = {
      studentId: studentId,
      schoolId: schoolId
    };

    if (subject) {
      whereClause.subject = subject;
    }

    const marks = await prisma.mark.findMany({
      where: whereClause,
      include: {
        assessment: true
      },
      orderBy: { assessmentId: 'desc' },
      take: parseInt(limit)
    });

    // Group by subject for trend analysis
    const subjectPerformance = {};
    marks.forEach(mark => {
      if (!subjectPerformance[mark.subject]) {
        subjectPerformance[mark.subject] = [];
      }
      subjectPerformance[mark.subject].push({
        marksObtained: mark.marksObtained,
        maxMarks: mark.maxMarks,
        percentage: mark.percentage,
        grade: mark.grade,
        examName: mark.assessment?.name,
        examDate: mark.assessment?.date
      });
    });

    res.json({
      allMarks: marks.map(mark => ({
        subject: mark.subject,
        marksObtained: mark.marksObtained,
        maxMarks: mark.maxMarks,
        percentage: mark.percentage,
        grade: mark.grade,
        examName: mark.assessment?.name,
        examDate: mark.assessment?.date
      })),
      subjectPerformance
    });
  } catch (error) {
    console.error('Academic Performance Error:', error.message);
    res.status(500).json({ message: 'Error fetching academic performance' });
  }
});

// Get Student Fee Records
router.get('/fees/records', async (req, res) => {
  try {
    const { studentId, schoolId } = req.parentFilters;

    const feeRecords = await prisma.feeRecord.findMany({
      where: {
        studentId: studentId,
        schoolId: schoolId
      },
      include: {
        template: true,
        transactions: {
          orderBy: { paymentDate: 'desc' }
        }
      },
      orderBy: { dueDate: 'desc' }
    });

    res.json(feeRecords);
  } catch (error) {
    console.error('Fee Records Error:', error.message);
    res.status(500).json({ message: 'Error fetching fee records' });
  }
});

// Get Student Assignments
router.get('/assignments', async (req, res) => {
  try {
    const { studentId, schoolId } = req.parentFilters;
    const { status, limit = 20 } = req.query;

    const whereClause = {
      studentId: studentId,
      schoolId: schoolId
    };

    if (status) {
      whereClause.status = status;
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      orderBy: { dueDate: 'desc' },
      take: parseInt(limit)
    });

    res.json(assignments);
  } catch (error) {
    console.error('Assignments Error:', error.message);
    res.status(500).json({ message: 'Error fetching assignments' });
  }
});

// Get Student Documents/Study Materials
router.get('/study-materials', async (req, res) => {
  try {
    const { studentId, schoolId } = req.parentFilters;
    const { subject, category, limit = 20 } = req.query;

    // Get student's class
    const student = await prisma.students.findUnique({
      where: { studentid: studentId },
      include: { class: true }
    });

    if (!student || !student.class) {
      return res.status(404).json({ message: 'Student class not found' });
    }

    const whereClause = {
      schoolId: schoolId,
      className: student.class.class_name
    };

    if (subject) {
      whereClause.subject = subject;
    }

    if (category) {
      whereClause.category = category;
    }

    const materials = await prisma.studyMaterial.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(materials);
  } catch (error) {
    console.error('Study Materials Error:', error.message);
    res.status(500).json({ message: 'Error fetching study materials' });
  }
});

// Get Parent Notifications
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, unreadOnly = false } = req.query;

    const whereClause = { userId: userId };
    
    if (unreadOnly === 'true') {
      whereClause.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(notifications);
  } catch (error) {
    console.error('Notifications Error:', error.message);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark Notification as Read
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.updateMany({
      where: {
        id: parseInt(notificationId),
        userId: userId
      },
      data: { read: true }
    });

    if (notification.count === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark Notification Read Error:', error.message);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

module.exports = router;
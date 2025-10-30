// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma'); // Prisma client
const { authMiddleware, authorize } = require('../middleware/authMiddleware'); // Updated middleware

// Helper: Get Full Name (Student ke liye)
const getFullName = (student) => {
  return [student?.first_name, student?.father_name, student?.last_name].filter(Boolean).join(' ');
}

/**
 * @route   GET /api/analytics/student/:studentId (Prisma ID)
 * @desc    Get detailed analytics for a single student
 * @access  Private (Admin, Teacher)
 */
router.get('/student/:studentId', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => { // Role Check
    const studentIdInt = parseInt(req.params.studentId);
    const schoolId = req.user.schoolId;

    if (isNaN(studentIdInt)) {
         return res.status(400).json({ msg: 'Invalid student ID format.' });
     }
    if (!schoolId) {
        return res.status(400).json({ msg: 'Invalid or missing school ID.' });
    }

    try {
        console.log(`[Analytics] Fetching data for student: ${studentIdInt}, school: ${schoolId}`);
        // Check if student exists in this school
        const student = await prisma.students.findUnique({ 
            where: { studentid: studentIdInt, schoolId: schoolId } 
        });
        if (!student) { return res.status(404).json({ msg: 'Student not found.' }); }

        // --- Calculate student analytics ---

        // Attendance
        const attendanceStats = await prisma.attendance.aggregate({
            where: { studentId: studentIdInt, schoolId: schoolId },
            _count: { id: true }, // Total records
        });
        const presentCount = await prisma.attendance.count({
            where: { studentId: studentIdInt, schoolId: schoolId, status: 'Present' }
        });
        const totalAttendanceDays = attendanceStats._count.id || 0;
        const attendancePercentage = totalAttendanceDays > 0 ? Math.round((presentCount / totalAttendanceDays) * 100) : 0;

        // Average Score
        // Note: Assuming 'percentage' field exists and is calculated in Mark model
        const averageScoreStats = await prisma.mark.aggregate({
            where: { studentId: studentIdInt, schoolId: schoolId, percentage: { not: null } },
            _avg: { percentage: true }
        });
        const averageScorePercentage = Math.round(averageScoreStats._avg.percentage || 0);

        // Assignments Count (Status check)
        const assignmentCount = await prisma.assignment.count({
            where: {
                studentId: studentIdInt, // Assuming Assignment links to student
                schoolId: schoolId,
                status: { in: ['Submitted', 'Graded'] }
            }
         });

        // Score Trend (Recent 5 marks with assessment details)
        const recentMarks = await prisma.mark.findMany({ 
            where: { studentId: studentIdInt, schoolId: schoolId, percentage: { not: null } }, 
            orderBy: { id: 'desc' }, // Use ID for latest
            take: 5,
            include: { assessment: { select: { name: true, date: true } } } // Populate assessment
        });
        const scoreTrend = recentMarks.map(mark => ({ 
            name: mark.assessment?.name || new Date(mark.id).toLocaleDateString(), // Use ID as fallback date marker
            score: mark.percentage || 0 
        })).reverse(); // Oldest first

        // Subject Mastery (Average score per subject)
        const subjectMasteryData = await prisma.mark.groupBy({
            by: ['subject'],
            where: { studentId: studentIdInt, schoolId: schoolId, percentage: { not: null }, subject: { not: null } },
            _avg: { percentage: true },
        });
        const formattedSubjectMastery = subjectMasteryData.map(item => ({
            subject: item.subject,
            score: Math.round(item._avg.percentage || 0)
        })).sort((a,b) => a.subject.localeCompare(b.subject));
        // --- End Calculations ---

        const analyticsData = {
          attendance: attendancePercentage,
          averageScore: averageScorePercentage,
          assignmentsCount: assignmentCount,
          scoreTrend: scoreTrend,
          subjectMastery: formattedSubjectMastery,
        };
        res.json(analyticsData);

    } catch (err) {
        console.error("Error fetching student analytics:", err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * @route   GET /api/analytics/class/:classId (Prisma ID)
 * @desc    Get aggregated analytics for a specific class
 * @access  Private (Admin, Teacher)
 */
router.get('/class/:classId', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => { // Role Check
    const classIdInt = parseInt(req.params.classId);
    const schoolId = req.user.schoolId;

    if (isNaN(classIdInt)) { return res.status(400).json({ msg: 'Invalid Class ID format.' }); }
    if (!schoolId) { return res.status(400).json({ msg: 'Invalid or missing school ID.' }); }

    try {
        console.log(`[Analytics] Fetching data for class: ${classIdInt}, school: ${schoolId}`);

        // Find students in the class
        const studentsInClass = await prisma.students.findMany({ 
            where: { classId: classIdInt, schoolId: schoolId },
            select: { studentid: true, first_name: true, father_name: true, last_name: true } // Fetch names for performers list
        });
        
        if (studentsInClass.length === 0) {
             console.log(`[Analytics] No students found for class ${classIdInt}.`);
             // Return default zero values
             return res.json({ classAttendance: 0, classAverageScore: 0, totalAssignments: 0, topPerformers: [], bottomPerformers: [], classSubjectAverages: [] });
        }
        const studentIdsInClass = studentsInClass.map(s => s.studentid);

        // Calculate Class Attendance
        const classAttendanceStats = await prisma.attendance.aggregate({
            where: { studentId: { in: studentIdsInClass }, schoolId: schoolId },
            _count: { id: true }
        });
         const classPresentCount = await prisma.attendance.count({
            where: { studentId: { in: studentIdsInClass }, schoolId: schoolId, status: 'Present' }
        });
        const classTotalAttendanceRecords = classAttendanceStats._count.id || 0;
        const classAttendancePercentage = classTotalAttendanceRecords > 0 ? Math.round((classPresentCount / classTotalAttendanceRecords) * 100) : 0;

        // Calculate Class Average Score & Get Top/Bottom Performers
        // Fetch average percentage directly per student using groupBy
        const studentAverageScoresData = await prisma.mark.groupBy({
            by: ['studentId'],
            where: { studentId: { in: studentIdsInClass }, schoolId: schoolId, percentage: { not: null } },
            _avg: { percentage: true },
        });

        // Map averages to student names
        const studentAverages = studentAverageScoresData.map(avgData => {
            const studentInfo = studentsInClass.find(s => s.studentid === avgData.studentId);
            return {
                name: studentInfo ? getFullName(studentInfo) : `Student ${avgData.studentId}`,
                averageScore: Math.round(avgData._avg.percentage || 0)
            }
        }).sort((a, b) => b.averageScore - a.averageScore); // Sort descending

        const classAverageScore = studentAverages.length > 0
            ? Math.round(studentAverages.reduce((sum, s) => sum + s.averageScore, 0) / studentAverages.length)
            : 0;

        const topPerformers = studentAverages.slice(0, 3);
        const bottomPerformers = studentAverages.slice(-3).reverse();

        // Calculate Total Assignments for the class
        // (Assuming Assignment links to classId OR studentId)
        const totalAssignments = await prisma.assignment.count({
             where: {
                 schoolId: schoolId,
                 OR: [
                     { classId: classIdInt },
                     { studentId: { in: studentIdsInClass } } 
                 ],
                 status: { in: ['Submitted', 'Graded'] }
             }
        });

        // Calculate Class Subject Averages
        const classSubjectAvgData = await prisma.mark.groupBy({
            by: ['subject'],
            where: { studentId: { in: studentIdsInClass }, schoolId: schoolId, percentage: { not: null }, subject: { not: null } },
            _avg: { percentage: true },
        });
        const formattedSubjectAvgs = classSubjectAvgData.map(item => ({
            subject: item.subject,
            score: Math.round(item._avg.percentage || 0)
        })).sort((a,b) => a.subject.localeCompare(b.subject));

        const analyticsData = {
          classAttendance: classAttendancePercentage,
          classAverageScore: classAverageScore,
          totalAssignments: totalAssignments,
          topPerformers: topPerformers,
          bottomPerformers: bottomPerformers,
          classSubjectAverages: formattedSubjectAvgs,
        };
        res.json(analyticsData);

    } catch (err) {
        console.error(`Error fetching class analytics for ${classIdInt}:`, err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * @route   GET /api/analytics/overall
 * @desc    Get aggregated analytics for the entire school
 * @access  Private (Admin)
 */
router.get('/overall', [authMiddleware, authorize('Admin')], async (req, res) => { // Role check Admin
    const schoolId = req.user.schoolId;
    if (!schoolId) { return res.status(400).json({ msg: 'Invalid or missing school ID.' }); }

    try {
        console.log(`[Analytics] Fetching overall data for school: ${schoolId}`);

        // Get Total Students
        const totalStudents = await prisma.students.count({ where: { schoolId: schoolId } });

        // Calculate Overall Attendance
        const overallAttendanceStats = await prisma.attendance.aggregate({
            where: { schoolId: schoolId },
            _count: { id: true }
        });
         const totalPresent = await prisma.attendance.count({
            where: { schoolId: schoolId, status: 'Present' }
        });
        const overallAttendance = (overallAttendanceStats._count.id || 0) > 0 ? Math.round((totalPresent / overallAttendanceStats._count.id) * 100) : 0;

        // Calculate Overall Average Score
        const overallScoreStats = await prisma.mark.aggregate({
            where: { schoolId: schoolId, percentage: { not: null } },
            _avg: { percentage: true }
        });
        const overallAverageScore = Math.round(overallScoreStats._avg.percentage || 0);

        // Calculate Class Performance (Average score per class)
        // Kadam 1: Har student ka average score calculate karein
         const studentAvgScores = await prisma.mark.groupBy({
             by: ['studentId'],
             where: { schoolId: schoolId, percentage: { not: null }},
             _avg: { percentage: true }
         });

        // Kadam 2: Students ko unki class ke saath fetch karein
        const studentsWithClass = await prisma.students.findMany({
            where: { schoolId: schoolId, studentid: { in: studentAvgScores.map(s => s.studentId) } },
            select: { studentid: true, classId: true }
        });
        
        // Kadam 3: Class ID se Class Name map fetch karein
         const classIds = [...new Set(studentsWithClass.map(s => s.classId))]; // Unique class IDs
         const classMap = new Map();
         if (classIds.length > 0) {
             const classes = await prisma.classes.findMany({
                 where: { classid: { in: classIds } },
                 select: { classid: true, class_name: true }
             });
             classes.forEach(c => classMap.set(c.classid, c.class_name));
         }

        // Kadam 4: Class-wise average calculate karein
        const classPerformanceMap = new Map();
        studentAvgScores.forEach(avgScore => {
            const studentInfo = studentsWithClass.find(s => s.studentid === avgScore.studentId);
            if (studentInfo) {
                const classId = studentInfo.classId;
                if (!classPerformanceMap.has(classId)) {
                    classPerformanceMap.set(classId, { totalScore: 0, count: 0 });
                }
                const classEntry = classPerformanceMap.get(classId);
                classEntry.totalScore += avgScore._avg.percentage || 0;
                classEntry.count += 1;
            }
        });

        const classPerformanceData = Array.from(classPerformanceMap.entries()).map(([classId, data]) => ({
            name: classMap.get(classId) || `Unknown Class (${classId})`,
            averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0
        })).sort((a, b) => a.name.localeCompare(b.name));


        // Calculate Subject Performance (Average score per subject)
        const subjectPerformanceDataRaw = await prisma.mark.groupBy({
            by: ['subject'],
            where: { schoolId: schoolId, percentage: { not: null }, subject: { not: null } },
            _avg: { percentage: true },
        });
         const subjectPerformanceData = subjectPerformanceDataRaw.map(item => ({
            subject: item.subject,
            averageScore: Math.round(item._avg.percentage || 0)
        })).sort((a, b) => a.subject.localeCompare(b.subject));

        const analyticsData = {
          totalStudents: totalStudents,
          overallAttendance: overallAttendance,
          overallAverageScore: overallAverageScore,
          classPerformance: classPerformanceData,
          subjectPerformance: subjectPerformanceData,
        };
        res.json(analyticsData);

    } catch (err) {
        console.error("Error fetching overall analytics:", err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
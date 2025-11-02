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
// --- Is function mein koi change nahi, yeh perfect tha ---
router.get('/student/:studentId', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => { 
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
        const student = await prisma.students.findUnique({ 
            where: { studentid: studentIdInt, schoolId: schoolId } 
        });
        if (!student) { return res.status(404).json({ msg: 'Student not found.' }); }

        // --- Calculate student analytics ---
        const attendanceStats = await prisma.attendance.aggregate({
            where: { studentId: studentIdInt, schoolId: schoolId },
            _count: { id: true }, 
        });
        const presentCount = await prisma.attendance.count({
            where: { studentId: studentIdInt, schoolId: schoolId, status: 'Present' }
        });
        const totalAttendanceDays = attendanceStats._count.id || 0;
        const attendancePercentage = totalAttendanceDays > 0 ? Math.round((presentCount / totalAttendanceDays) * 100) : 0;

        const averageScoreStats = await prisma.mark.aggregate({
            where: { studentId: studentIdInt, schoolId: schoolId, percentage: { not: null } },
            _avg: { percentage: true }
        });
        const averageScorePercentage = Math.round(averageScoreStats._avg.percentage || 0);

        const assignmentCount = await prisma.assignment.count({
            where: {
                studentId: studentIdInt, 
                schoolId: schoolId,
                status: { in: ['Submitted', 'Graded'] }
            }
         });

        const recentMarks = await prisma.mark.findMany({ 
            where: { studentId: studentIdInt, schoolId: schoolId, percentage: { not: null } }, 
            orderBy: { id: 'desc' }, 
            take: 5,
            include: { assessment: { select: { name: true, date: true } } } 
        });
        const scoreTrend = recentMarks.map(mark => ({ 
            name: mark.assessment?.name || new Date(mark.id).toLocaleDateString(), 
            score: mark.percentage || 0 
        })).reverse(); 

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
 * @route   GET /api/analytics/class/:className (URL Encoded String)
 * @desc    Get aggregated analytics for a specific class
 * @access  Private (Admin, Teacher)
 */
// --- YAHAN FIX KIYA GAYA HAI ---
router.get('/class/:className', [authMiddleware, authorize('Admin', 'Teacher')], async (req, res) => { 
    
    // Kadam 1: classId ke bajaye className (string) lein
    const className = decodeURIComponent(req.params.className); // e.g., "7th" ya "10th A"
    const schoolId = req.user.schoolId;

    // Kadam 2: Validation check update kiya
    if (!className) { return res.status(400).json({ msg: 'Class name is required.' }); }
    if (!schoolId) { return res.status(400).json({ msg: 'Invalid or missing school ID.' }); }

    try {
        console.log(`[Analytics] Fetching data for class: ${className}, school: ${schoolId}`);
        
        // Kadam 3: Class ka naam (string) use karke uski ID dhoondhein
        const classRecord = await prisma.classes.findUnique({
            where: {
                // Yeh (schoolId, class_name) unique combination par depend karta hai
                schoolId_class_name: {
                    schoolId: schoolId,
                    class_name: className
                }
            },
            select: { classid: true }
        });

        if (!classRecord) {
            console.warn(`[Analytics] Class not found: ${className}`);
            return res.status(404).json({ msg: `Class '${className}' not found.` });
        }
        
        // Kadam 4: Ab humein Class ID mil gayi hai
        const classIdInt = classRecord.classid;
        // --- END FIX ---

        // (Baaki ka poora logic waisa hi hai jaisa aapne likha tha, kyunki woh perfect tha)
        
        const studentsInClass = await prisma.students.findMany({ 
            where: { classId: classIdInt, schoolId: schoolId },
            select: { studentid: true, first_name: true, father_name: true, last_name: true } 
        });
        
        if (studentsInClass.length === 0) {
             console.log(`[Analytics] No students found for class ${classIdInt}.`);
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
        const studentAverageScoresData = await prisma.mark.groupBy({
            by: ['studentId'],
            where: { studentId: { in: studentIdsInClass }, schoolId: schoolId, percentage: { not: null } },
            _avg: { percentage: true },
        });

        const studentAverages = studentAverageScoresData.map(avgData => {
            const studentInfo = studentsInClass.find(s => s.studentid === avgData.studentId);
            return {
                name: studentInfo ? getFullName(studentInfo) : `Student ${avgData.studentId}`,
                averageScore: Math.round(avgData._avg.percentage || 0)
            }
        }).sort((a, b) => b.averageScore - a.averageScore); 

        const classAverageScore = studentAverages.length > 0
            ? Math.round(studentAverages.reduce((sum, s) => sum + s.averageScore, 0) / studentAverages.length)
            : 0;

        const topPerformers = studentAverages.slice(0, 3);
        const bottomPerformers = studentAverages.slice(-3).reverse();

        // Calculate Total Assignments
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
        console.error(`Error fetching class analytics for ${req.params.className}:`, err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * @route   GET /api/analytics/overall
 * @desc    Get aggregated analytics for the entire school
 * @access  Private (Admin)
 */
// --- Is function mein koi change nahi, yeh perfect tha ---
router.get('/overall', [authMiddleware, authorize('Admin')], async (req, res) => { 
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
         const studentAvgScores = await prisma.mark.groupBy({
             by: ['studentId'],
             where: { schoolId: schoolId, percentage: { not: null }},
             _avg: { percentage: true }
         });

        const studentsWithClass = await prisma.students.findMany({
            where: { schoolId: schoolId, studentid: { in: studentAvgScores.map(s => s.studentId) } },
            select: { studentid: true, classId: true }
        });
        
         const classIds = [...new Set(studentsWithClass.map(s => s.classId))]; 
         const classMap = new Map();
         if (classIds.length > 0) {
             const classes = await prisma.classes.findMany({
                 where: { classid: { in: classIds } },
                 select: { classid: true, class_name: true }
             });
             classes.forEach(c => classMap.set(c.classid, c.class_name));
         }

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
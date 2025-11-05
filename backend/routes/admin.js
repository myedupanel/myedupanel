// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma'); 
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto'); 
const jwt = require('jsonwebtoken'); 
const sendEmail = require('../utils/sendEmail');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware'); 
const userController = require('../controllers/userController'); 

// Helper: Get Full Name (Student ke liye)
const getFullName = (student) => {
  return [student?.first_name, student?.father_name, student?.last_name].filter(Boolean).join(' ');
}

// Helper Function: JWT Token Generate karna (No Change)
const generateToken = (userId, schoolId) => {
  return jwt.sign({ id: userId, schoolId: schoolId }, process.env.JWT_SECRET, {
    expiresIn: '30d', 
  });
};

// @route POST /api/admin/create-user
router.post('/create-user', [authMiddleware, adminMiddleware], userController.createUserByAdmin);


// @route GET /api/admin/dashboard-data (FIXED)
router.get('/dashboard-data', [authMiddleware, adminMiddleware], async (req, res) => {
    console.log("[GET /dashboard-data] Request received.");
    try {
        const schoolId = req.user.schoolId; 
        if (!schoolId) {
            console.log("[GET /dashboard-data] Error: Missing schoolId in token.");
            return res.status(400).json({ msg: 'Admin school information missing.' });
        }
        console.log(`[GET /dashboard-data] Fetching data for schoolId: ${schoolId}`);
        
        // Current month ka revenue calculate karne ke liye dates set ki
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const currentMonthName = now.toLocaleString('default', { month: 'long' }); // Jaise "November"

        const staffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'Staff']; 

        const [
            studentCount,
            teacherCount,
            parentCount,
            staffCount,
            recentStudentsRaw,
            recentTeachersRaw,
            recentParents,
            recentStaff,
            recentPaidTransactions, // <-- YAHAN FIX KIYA: Naam badla
            admissionsDataRaw,
            classCountsRaw,
            monthlyRevenueRaw 
        ] = await Promise.all([
            // Total Counts (No Change)
            prisma.students.count({ where: { schoolId: schoolId } }), 
            prisma.teachers.count({ where: { schoolId: schoolId } }),
            prisma.parent.count({ where: { schoolId: schoolId } }),   
            prisma.user.count({ where: { role: { in: staffRoles }, schoolId: schoolId } }),

            // --- RECENT STUDENTS (No Change) ---
            prisma.students.findMany({ 
                where: { schoolId }, 
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
            }), 
            
            prisma.teachers.findMany({ 
                where: { schoolId }, 
                orderBy: { teacher_dbid: 'desc' }, 
                take: 5, 
                select: { name: true, subject: true, teacher_dbid: true } 
            }),

            prisma.parent.findMany({ where: { schoolId }, orderBy: { id: 'desc' }, take: 5, select: { name: true, id: true } }), 
            prisma.user.findMany({ where: { role: { in: staffRoles }, schoolId }, orderBy: { id: 'desc' }, take: 5, select: { name: true, role: true, id: true } }), 

            // --- YAHAN FIX KIYA: 'FeeRecord' ki jagah 'Transaction' se fetch kiya ---
            prisma.transaction.findMany({
                where: { schoolId: schoolId, status: 'Success' },
                orderBy: { paymentDate: 'desc' }, // Asli date se sort kiya
                take: 5,
                select: { 
                    id: true, 
                    amountPaid: true, // 'amount' ki jagah 'amountPaid'
                    paymentDate: true, // <-- Asli date fetch ki
                    student: { 
                        select: { first_name: true, father_name: true, last_name: true } 
                    }
                }
            }),
            // --- FIX ENDS ---

            // Aggregations (No Change)
             prisma.students.groupBy({
                 by: ['admission_date'], 
                 where: { schoolId: schoolId, admission_date: { not: null } },
                 _count: { studentid: true }, 
                 orderBy: { admission_date: 'asc'}
             }),
             
            prisma.students.groupBy({
                by: ['classid'],
                where: { schoolId: schoolId },
                _count: { studentid: true }, 
            }),
            
            // Monthly Revenue (No Change from last fix)
            prisma.transaction.aggregate({
                _sum: { amountPaid: true }, 
                where: {
                    schoolId: schoolId,
                    status: 'Success', 
                    paymentDate: { 
                        gte: startOfMonth,
                        lt: nextMonthStart
                    }
                }
            })

        ]).catch(err => {
            console.error("[GET /dashboard-data] Error during Promise.all:\n", err);
            res.status(500).send('Server Error fetching dashboard data');
            throw err; 
        });

        // --- Process Admissions Data (No Change) ---
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const admissionsMap = new Map(monthNames.map((name, index) => [index + 1, { name, admissions: 0 }]));
        
        admissionsDataRaw.forEach(item => {
            if (item.admission_date) {
                 const month = item.admission_date.getMonth() + 1; 
                 if (admissionsMap.has(month)) {
                    admissionsMap.get(month).admissions += item._count.studentid; 
                 }
            }
        });
        const admissionsData = Array.from(admissionsMap.values());


        // --- Process Class Counts Data (No Change) ---
         const classIds = classCountsRaw.map(item => item.classid);
         const classesInfo = await prisma.classes.findMany({
             where: { classid: { in: classIds } },
             select: { classid: true, class_name: true }
         });
         const classCounts = classCountsRaw.map(item => {
             const classInfo = classesInfo.find(c => c.classid === item.classid);
             return {
                 name: classInfo?.class_name || `Unknown Class (${item.classid})`,
                 count: item._count.studentid 
             }
         }).sort((a, b) => a.name.localeCompare(b.name)); 

        // --- YAHAN FIX KIYA: Date ko format karne ke liye helper function ---
        const formatRecentDate = (date) => {
            if (!date) return '';
            return new Date(date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric'
            }); // Jaise "05 Nov 2025"
        };
        // --- FIX ENDS ---

        // --- YAHAN FIX KIYA: Recent Payments ko format kiya ---
        const recentFees = recentPaidTransactions.map(tx => ({
            id: tx.id, 
            student: getFullName(tx.student) || 'Unknown Student', 
            amount: `₹${tx.amountPaid?.toLocaleString('en-IN') || 0}`,
            date: formatRecentDate(tx.paymentDate) // <-- 'ID: ...' ki jagah asli date
        }));
        // --- FIX ENDS ---

        // --- Format Recent Lists (No Change) ---
         const formattedRecentStudents = recentStudentsRaw.map(s => ({ 
             id: s.studentid, 
             name: getFullName(s), 
             class: s.class?.class_name 
         }));
         
         const formattedRecentTeachers = recentTeachersRaw.map(t => ({
             id: t.teacher_dbid,
             name: t.name,
             subject: t.subject
         }));

        // Revenue data (No Change)
        const currentMonthRevenue = monthlyRevenueRaw._sum.amountPaid || 0;


        // --- Final Data Object (No Change) ---
        const dashboardData = {
            totalStudents: studentCount || 0, 
            totalTeachers: teacherCount || 0,
            totalParents: parentCount || 0,
            totalStaff: staffCount || 0,
            admissionsData,
            classCounts,
            recentStudents: formattedRecentStudents || [],
            recentTeachers: formattedRecentTeachers || [], 
            recentParents: recentParents || [],
            recentStaff: recentStaff || [],
            recentFees,
            currentMonthRevenue: currentMonthRevenue,
            currentMonthName: currentMonthName
        };
        console.log(`[GET /dashboard-data] Sending final data. Revenue: ${currentMonthRevenue}`);
        res.json(dashboardData);

    } catch (err) {
        console.error("[GET /dashboard-data] Outer CATCH BLOCK Error:", err);
        res.status(500).send('Server Error');
    }
});

// @route PUT /api/admin/profile (No Change)
router.put('/profile', [authMiddleware, adminMiddleware], async (req, res) => { 
    const { adminName, schoolName } = req.body;
    const userId = req.user.id; 
    console.log(`[PUT /profile] START - User ID: ${userId} requested update. Name: '${adminName}', School: '${schoolName}'`);

    if (!adminName || !schoolName) {
        console.log(`[PUT /profile] Error: Missing names.`);
        return res.status(400).json({ message: 'Full name and school name required.' });
    }
    const requestedSchoolNameTrimmed = schoolName.trim();
    const requestedAdminNameTrimmed = adminName.trim();

    try {
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');
            if (user.role !== 'Admin') throw new Error('Forbidden.'); 

            const school = await tx.school.findUnique({ where: { id: user.schoolId } });
            if (!school) throw new Error('Associated school not found.');
            console.log(`[PUT /profile] Found User: ${user.name}, School: ${school.name}`);

            let schoolUpdateData = {};
            let userUpdateData = {};
            let newSchoolNameForToken = school.name; 

            if (requestedSchoolNameTrimmed && requestedSchoolNameTrimmed !== school.name) {
                console.log(`[PUT /profile] School name change requested.`);
                if (user.schoolNameLastUpdated) {
                    const lastUpdate = new Date(user.schoolNameLastUpdated);
                    const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                    if (lastUpdate > ninetyDaysAgo) {
                        const daysRemaining = Math.ceil((lastUpdate.getTime() + 90 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
                        throw new Error(`School name can be changed once every 90 days. Try again in ${daysRemaining} day(s).`);
                    }
                }
                const existingSchool = await tx.school.findFirst({
                    where: { name: { equals: requestedSchoolNameTrimmed, mode: 'insensitive' }, NOT: { id: user.schoolId } }
                });
                if (existingSchool) throw new Error('School name already registered.');

                schoolUpdateData.name = requestedSchoolNameTrimmed;
                userUpdateData.schoolNameLastUpdated = new Date(); 
                newSchoolNameForToken = requestedSchoolNameTrimmed;
                console.log(`[PUT /profile] School name marked for update.`);
            }

            if (requestedAdminNameTrimmed && requestedAdminNameTrimmed !== user.name) {
                console.log(`[PUT /profile] Admin name change requested.`);
                userUpdateData.name = requestedAdminNameTrimmed;
            }

            let updatedUser = user; 
            if (Object.keys(schoolUpdateData).length > 0) {
                 await tx.school.update({ where: { id: user.schoolId }, data: schoolUpdateData });
                 console.log(`[PUT /profile] School updated.`);
            }
             if (Object.keys(userUpdateData).length > 0) {
                 updatedUser = await tx.user.update({ where: { id: userId }, data: userUpdateData });
                 console.log(`[PUT /profile] User updated.`);
            } else {
                 console.log(`[PUT /profile] No changes needed.`);
            }
            
            return { updatedUser, newSchoolNameForToken };
            
        }); 

        console.log(`[PUT /profile] Documents saved successfully.`);

        const payload = {
            id: result.updatedUser.id,
            role: result.updatedUser.role,
            name: result.updatedUser.name, 
            schoolId: result.updatedUser.schoolId,
            schoolName: result.newSchoolNameForToken 
        };
         const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }); 
         
        console.log(`[PUT /profile] Generating new token.`);
        res.json({ message: 'Profile updated successfully!', token });

    } catch (error) {
        console.error("[PUT /profile] CATCH BLOCK ERROR:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) { 
             return res.status(400).json({ message: 'Failed to update school name, it might already be taken.' });
        }
         if (error.code === 'P2025') { 
              return res.status(404).json({ message: 'User or School not found.'});
         }
         if (error.message.includes('90 days') || error.message.includes('already registered')) {
              return res.status(400).json({ message: error.message });
         }
         if (error.message === 'Forbidden.') {
              return res.status(403).json({ message: error.message });
         }
        res.status(500).send('Server Error updating profile');
    }
});


// @route POST /api/admin/seed-standard-classes (No Change)
const seedStandardClasses = async (req, res) => {
    console.log("[POST /seed-standard-classes] Request received.");
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) {
            console.log("[POST /seed-standard-classes] Error: Missing schoolId.");
            return res.status(400).json({ msg: 'Admin school information missing.' });
        }

        const standardClasses = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

        const existingClasses = await prisma.classes.findMany({
            where: { schoolId: schoolId, class_name: { in: standardClasses } },
            select: { class_name: true }
        });
        const existingClassNames = new Set(existingClasses.map(c => c.class_name));
        console.log(`[POST /seed] Found ${existingClassNames.size} existing standard classes.`);

        const missingClassNames = standardClasses.filter(name => !existingClassNames.has(name));
        console.log(`[POST /seed] Missing ${missingClassNames.length} classes: [${missingClassNames.join(', ')}]`);

        if (missingClassNames.length === 0) {
            console.log("[POST /seed] No missing classes.");
            return res.status(200).json({ message: 'All standard classes already exist.', added: 0 });
        }

        const newClassDocs = missingClassNames.map(name => ({
            class_name: name,
            schoolId: schoolId,
        }));

        const result = await prisma.classes.createMany({
            data: newClassDocs,
            skipDuplicates: true 
        });
        console.log(`[POST /seed] Inserted ${result.count} new classes.`);

        res.status(201).json({
            message: `Successfully added ${result.count} new standard classes.`,
            added: result.count,
        });

    } catch (err) {
        console.error("[POST /seed] CATCH BLOCK ERROR:", err);
         if (err.code === 'P2002') { 
            return res.status(400).json({ msg: 'A duplicate class name error occurred.' });
        }
        res.status(500).send('Server Error while seeding classes');
    }
};

router.post('/seed-standard-classes', [authMiddleware, adminMiddleware], seedStandardClasses);

module.exports = router;
const express = require('express');
const router = express.Router();
const generatePassword = require('generate-password');
const sendEmail = require('../utils/sendEmail');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma');
const { Prisma } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// @route   POST /api/staff
// @desc    Add staff user (Login + Profile)
// @access  Private (Admin)
router.post('/', [authMiddleware, authorize('Admin')], async (req, res) => {
    const { staffId, name, role: staffRole, contactNumber, email, joiningDate, leavingDate } = req.body;
    console.log("[POST /staff] Received data:", req.body);
    const schoolIdFromToken = req.user.schoolId;
    const schoolNameFromToken = req.user.schoolName || 'Your School';

    if (!schoolIdFromToken) return res.status(400).json({ msg: 'Admin school info missing.' });
    if (!name || !staffRole || !email || !staffId) return res.status(400).json({ msg: 'Staff ID, Name, Role, Email are required.' });

    const allowedStaffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'staff'];
    if (!allowedStaffRoles.includes(staffRole)) {
        return res.status(400).json({ msg: `Invalid role specified: ${staffRole}` });
    }

    try {
        const providedEmail = email.trim().toLowerCase();
        
        // Check karein ki User (email) ya Staff (staffId) pehle se exist toh nahi karta
        const existingUser = await prisma.user.findUnique({
            where: { email: providedEmail }
        });
        if (existingUser) {
            console.log(`[POST /staff] Error: Email '${providedEmail}' exists.`);
            return res.status(400).json({ msg: 'A user account with this email already exists.' });
        }
        
        const existingStaffId = await prisma.staff.findUnique({
            where: { schoolId_staffId: { schoolId: schoolIdFromToken, staffId: staffId } }
        });
        if (existingStaffId) {
             return res.status(400).json({ msg: 'This Staff ID is already in use.' });
        }
        
        console.log(`[POST /staff] Email '${providedEmail}' and StaffID '${staffId}' are unique.`);

        const password = generatePassword.generate({ length: 10, numbers: true });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log(`[POST /staff] Creating User and Staff Profile in transaction...`);
        
        // Transaction: Dono table mein ek saath create karein
        const savedUser = await prisma.user.create({
            data: {
                name: name,
                schoolId: schoolIdFromToken,
                email: providedEmail,
                password: hashedPassword,
                role: staffRole,
                isVerified: true,
                // --- FIX 1: details JSON field ko HATA DIYA ---
                
                // Naya Staff Profile banayein
                staffProfile: {
                    create: {
                        staffId: staffId,
                        contactNumber: contactNumber,
                        joiningDate: joiningDate ? new Date(joiningDate) : null,
                        leavingDate: leavingDate ? new Date(leavingDate) : null,
                        schoolId: schoolIdFromToken,
                    }
                }
            },
            // Naya profile data response ke liye include karein
            include: {
                staffProfile: true
            }
        });
        
        console.log(`[POST /staff] User (${savedUser.id}) and Staff Profile (${savedUser.staffProfile.id}) saved.`);

        if (req.io) {
            console.log('[POST /staff] Emitting events.');
            const { password: _, ...staffDataForEmit } = savedUser;
            req.io.emit('updateDashboard');
            req.io.emit('staff_added', staffDataForEmit);
        }

        try {
            const subject = `Your SchoolPro Staff Account at ${schoolNameFromToken}`;
            const message = `<h1>Welcome ${name},</h1><p>Account created for ${schoolNameFromToken}.</p><p>Email: ${providedEmail}</p><p>Password: ${password}</p><p>Please login and change your password.</p>`;
            await sendEmail({ to: providedEmail, subject, html: message });
            console.log(`[POST /staff] Welcome email sent to ${providedEmail}`);
        } catch (emailError) {
            console.error(`[POST /staff] Could not send welcome email:`, emailError);
        }

        const { password: __, ...userResponse } = savedUser;
        res.status(201).json({ message: 'Staff user created.', user: userResponse });

    } catch (err) {
        console.error("[POST /staff] CAUGHT ERROR:", err);
        if (err.code === 'P2002') {
             const target = err.meta?.target || [];
             if (target.includes('email')) {
                 return res.status(400).json({ msg: 'Email already exists.' });
             }
             if (target.includes('staffId')) {
                 return res.status(400).json({ msg: 'Staff ID already exists.' });
             }
             return res.status(400).json({ msg: `Unique constraint failed on ${target.join(', ')}` });
        }
         if (err instanceof Prisma.PrismaClientValidationError) {
            console.error("Prisma Validation Error:", err.message);
            return res.status(400).json({ msg: 'Invalid data provided. (Check schema)' });
        }
        res.status(500).send('Server Error creating staff.');
    }
});
// --- POST END BADLAAV ---

// @route   GET /api/staff
// @desc    Get staff list
// @access  Private (Admin)
router.get('/', [authMiddleware, authorize('Admin')], async (req, res) => {
    console.log("[GET /staff] Request received.");
    try {
        const schoolIdFromToken = req.user.schoolId;
        if (!schoolIdFromToken) return res.status(400).json({ msg: 'Admin school info missing.' });
        console.log(`[GET /staff] Fetching for schoolId: ${schoolIdFromToken}`);

        const staffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'staff'];

        console.log("[GET /staff] Running findMany with staffProfile include...");
        const staffList = await prisma.user.findMany({
            where: {
                schoolId: schoolIdFromToken,
                role: { in: staffRoles }
            },
            // --- FIX 2: details field ko HATA DIYA ---
            include: {
                staffProfile: false, // <-- Bas yahi chahiye
            },
            orderBy: {
                name: 'asc'
            }
        });
        console.log(`[GET /staff] Query successful. Found ${staffList.length} members.`);

        // Ab humein data manually filter karna hoga taaki password na jaaye
        // Aur frontend ke liye data flatten (seedha) karein
        const formattedStaffList = staffList.map(user => {
            const { password, ...safeUser } = user; // Password ko exclude kiya
            
            // User aur Staff Profile ko mix karke ek object banayein
            return {
                ...safeUser, // id, name, email, role etc.
                ...(safeUser.staffProfile || {}) // contactNumber, staffId, joiningDate etc.
            };
        });

        console.log(`[GET /staff] Returning ${formattedStaffList.length} formatted members.`);
        res.json({ data: formattedStaffList }); // Naya formatted list bhej rahe hain

    } catch (err) {
        console.error("[GET /staff] Error:", err.message, err.stack);
        // Ab yeh error nahi aana chahiye, agar aata hai toh client-side se aata hai
        res.status(500).send('Server Error fetching staff.');
    }
});
// --- GET END BADLAAV ---

// @route   PUT /api/staff/:id
// @desc    Update staff user
// @access  Private (Admin)
router.put('/:id', [authMiddleware, authorize('Admin')], async (req, res) => {
    const { id } = req.params; // Yeh User ID hai
    const { staffId, name, role: staffRole, contactNumber, email, joiningDate, leavingDate } = req.body;
    const schoolIdFromToken = req.user.schoolId;
    const userId = parseInt(id);
    console.log(`[PUT /staff/${id}] Received data:`, req.body);

    if (isNaN(userId)) return res.status(400).json({ msg: 'Invalid ID.' });
    if (!name || !staffRole || !email || !staffId) return res.status(400).json({ msg: 'Staff ID, Name, Role, Email are required.' });

    const allowedStaffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'staff'];
    if (!allowedStaffRoles.includes(staffRole)) {
        return res.status(400).json({ msg: `Invalid role specified: ${staffRole}` });
    }

    try {
        // User ko dhoondhein
        let userToUpdate = await prisma.user.findFirst({
            where: { id: userId, schoolId: schoolIdFromToken }
        });
        if (!userToUpdate) return res.status(404).json({ msg: 'Staff not found.' });

        // Email update logic (No Change)
        const newEmail = email.trim().toLowerCase();
        let emailUpdateData = {};
        if (newEmail !== userToUpdate.email) {
             const existingUser = await prisma.user.findFirst({
                 where: { email: newEmail, NOT: { id: userId } }
             });
            if (existingUser) return res.status(400).json({ msg: 'Email already exists.' });
            emailUpdateData.email = newEmail;
        }

        // Transaction: User aur Staff Profile, dono ko update karein
        const [updatedUser, updatedStaffProfile] = await prisma.$transaction([
            // 1. User table update karein
            prisma.user.update({
                where: { id: userId },
                data: {
                    name: name,
                    role: staffRole,
                    ...emailUpdateData,
                    // --- FIX 3: details JSON field ko HATA DIYA ---
                }
            }),
            // 2. Staff table update karein
            prisma.staff.update({
                where: { userId: userId }, // Hum User ID se staff profile dhoondh rahe hain
                data: {
                    staffId: staffId,
                    contactNumber: contactNumber,
                    joiningDate: joiningDate ? new Date(joiningDate) : null,
                    leavingDate: leavingDate ? new Date(leavingDate) : null
                }
            })
        ]);
        
        console.log(`[PUT /staff/${id}] User and Staff Profile updated.`);
        
        // Frontend ko poora updated data bhejein
        const combinedUpdatedUser = { ...updatedUser, staffProfile: updatedStaffProfile };

        if (req.io) {
            console.log(`[PUT /staff/${id}] Emitting events.`);
            req.io.emit('updateDashboard');
             const { password: _, ...staffDataForEmit } = combinedUpdatedUser;
            req.io.emit('staff_updated', staffDataForEmit);
        }

        const { password: __, ...userResponse } = combinedUpdatedUser;
        res.json({ message: 'Staff updated.', user: userResponse });

    } catch (err) {
        console.error(`[PUT /staff/${id}] CAUGHT ERROR:`, err);
        if (err.code === 'P2002') { // Unique constraint fail
             const target = err.meta?.target || [];
             if (target.includes('email')) {
                 return res.status(400).json({ msg: 'Email already exists.' });
             }
             if (target.includes('staffId')) { // Naya check
                 return res.status(400).json({ msg: 'Staff ID already exists.' });
             }
             return res.status(400).json({ msg: `Unique constraint failed on ${target.join(', ')}` });
        }
         if (err instanceof Prisma.PrismaClientValidationError) {
            console.error("Prisma Validation Error:", err.message);
            return res.status(400).json({ msg: 'Invalid data provided. (Check schema)' });
        }
        res.status(500).send('Server Error updating staff.');
    }
});
// --- PUT END BADLAAV ---

// @route   DELETE /api/staff/:id
// @desc    Delete staff user (Login + Profile)
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, authorize('Admin')], async (req, res) => {
    const { id } = req.params; // Yeh User ID hai
    const schoolIdFromToken = req.user.schoolId;
    const userId = parseInt(id);
    console.log(`[DELETE /staff/${id}] Request received.`);

    if (isNaN(userId)) return res.status(400).json({ msg: 'Invalid ID.' });

    try {
        // Hum sirf User ko delete karenge.
        // Kyunki schema mein "onDelete: Cascade" hai,
        // related Staff profile automatically delete ho jayega.
        
        const userToDelete = await prisma.user.findFirst({
            where: { id: userId, schoolId: schoolIdFromToken }
        });
        if (!userToDelete) return res.status(404).json({ msg: 'Staff not found.' });

        await prisma.user.delete({
            where: { id: userId }
        });
        console.log(`[DELETE /staff/${id}] User deleted (Staff profile cascaded).`);

        if (req.io) {
             console.log(`[DELETE /staff/${id}] Emitting events.`);
            req.io.emit('updateDashboard');
            req.io.emit('staff_deleted', { id: userId, schoolId: schoolIdFromToken });
        }

        res.json({ msg: 'Staff deleted.' });

    } catch (err) {
        console.error(`[DELETE /staff/${id}] CAUGHT ERROR:`, err.message, err.stack);
        if (err.code === 'P2025') {
             return res.status(404).json({ msg: 'Staff member not found during delete.' });
        }
        res.status(500).send('Server Error deleting staff.');
    }
});
// --- DELETE END BADLAAV ---

module.exports = router;
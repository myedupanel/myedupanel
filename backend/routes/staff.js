const express = require('express');
const router = express.Router();
const generatePassword = require('generate-password');
const sendEmail = require('../utils/sendEmail');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma');
const { Prisma } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // bcrypt ko upar import kar liya

// @route   POST /api/staff
// @desc    Add staff user
// @access  Private (Admin)
router.post('/', [authMiddleware, authorize('Admin')], async (req, res) => {
    const { staffId, name, role: staffRole, contactNumber, email, joiningDate, leavingDate } = req.body;
    console.log("[POST /staff] Received data:", req.body);
    const schoolIdFromToken = req.user.schoolId;
    const schoolNameFromToken = req.user.schoolName || 'Your School';

    if (!schoolIdFromToken) return res.status(400).json({ msg: 'Admin school info missing.' });
    if (!name || !staffRole || !email) return res.status(400).json({ msg: 'Name, Role, Email are required.' });

    const allowedStaffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'staff'];
    if (!allowedStaffRoles.includes(staffRole)) {
        return res.status(400).json({ msg: `Invalid role specified: ${staffRole}` });
    }

    try {
        const providedEmail = email.trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({
            where: { email: providedEmail }
        });

        if (existingUser) {
            console.log(`[POST /staff] Error: Email '${providedEmail}' exists.`);
            return res.status(400).json({ msg: 'A user account with this email already exists.' });
        }
        console.log(`[POST /staff] Email '${providedEmail}' is unique.`);

        const password = generatePassword.generate({ length: 10, numbers: true });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log(`[POST /staff] Creating User: ${name}, Role: ${staffRole}`);

        const savedUser = await prisma.user.create({
            data: {
                name: name,
                schoolId: schoolIdFromToken,
                email: providedEmail,
                password: hashedPassword,
                role: staffRole,
                isVerified: true,
                // 'details' field ko comment out rakha hai taaki crash na ho
                /*
                details: {
                    staffId: staffId,
                    contactNumber: contactNumber,
                    joiningDate: joiningDate ? new Date(joiningDate) : null,
                    leavingDate: leavingDate ? new Date(leavingDate) : null
                }
                */
            }
        });
        console.log(`[POST /staff] User saved. ID: ${savedUser.id}`);

        if (req.io) {
            console.log('[POST /staff] Emitting updateDashboard.');
            req.io.emit('updateDashboard');
            const { password: _, ...staffDataForEmit } = savedUser;
            console.log('[POST /staff] Emitting staff_added:', staffDataForEmit);
            req.io.emit('staff_added', staffDataForEmit);
        } else {
            console.warn('[POST /staff] req.io not found.');
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
             } else {
                 return res.status(400).json({ msg: `Unique constraint failed on ${target.join(', ')}` });
             }
        }
         if (err instanceof Prisma.PrismaClientValidationError) {
            console.error("Prisma Validation Error (Hint: Check if 'details' field exists in User schema):", err.message);
            return res.status(400).json({ msg: 'Invalid data provided. (Check schema)' });
        }
        res.status(500).send('Server Error creating staff.');
    }
});

// =================================================================
// --- YAHAN BADLAAV KIYA GAYA HAI ---
// =================================================================
// @route   GET /api/staff
// @desc    Get staff list
// @access  Private (Admin)
router.get('/', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    console.log("[GET /staff] Request received.");
    try {
        const schoolIdFromToken = req.user.schoolId;
        if (!schoolIdFromToken) return res.status(400).json({ msg: 'Admin school info missing.' });
        console.log(`[GET /staff] Fetching for schoolId: ${schoolIdFromToken}`);

        const staffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'staff'];

        // --- DIAGNOSTIC FIX ---
        // Humne `select` aur `orderBy` ko temporary hata diya hai
        // taaki check kar sakein ki problem kahaan hai.
        console.log("[GET /staff] Running simplified findMany...");
        const staffList = await prisma.user.findMany({
            where: {
                schoolId: schoolIdFromToken,
                role: { in: staffRoles }
            },
            // `select` ko hatane se Prisma saare fields fetch karega
            // Agar `details` field schema mein nahi hai, toh yeh fail nahi hoga.
            // `orderBy` ko bhi hata diya hai in case `createdAt` problematic tha.
        });
        console.log(`[GET /staff] Simplified query successful. Found ${staffList.length} members.`);

        // Ab humein data manually filter karna hoga taaki password na jaaye
        const safeStaffList = staffList.map(user => {
            const { password, ...safeUser } = user; // Password ko exclude kiya
            return safeUser;
        });

        console.log(`[GET /staff] Returning ${safeStaffList.length} safe members.`);
        res.json({ data: safeStaffList }); // Safe list bhej rahe hain

    } catch (err) {
        console.error("[GET /staff] Error:", err.message, err.stack);
        res.status(500).send('Server Error fetching staff.');
    }
});
// =================================================================
// --- END BADLAAV ---
// =================================================================


// @route   PUT /api/staff/:id
// @desc    Update staff user
// @access  Private (Admin)
router.put('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    const { id } = req.params;
    const { staffId, name, role: staffRole, contactNumber, email, joiningDate, leavingDate } = req.body;
    const schoolIdFromToken = req.user.schoolId;
    const userId = parseInt(id);
    console.log(`[PUT /staff/${id}] Received data:`, req.body);

    if (isNaN(userId)) return res.status(400).json({ msg: 'Invalid ID.' });
    if (!name || !staffRole || !email) return res.status(400).json({ msg: 'Name, Role, Email required.' });

    const allowedStaffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'staff'];
    if (!allowedStaffRoles.includes(staffRole)) {
        return res.status(400).json({ msg: `Invalid role specified: ${staffRole}` });
    }

    try {
        let userToUpdate = await prisma.user.findFirst({
            where: { id: userId, schoolId: schoolIdFromToken }
        });
        if (!userToUpdate) return res.status(404).json({ msg: 'Staff not found.' });

        const newEmail = email.trim().toLowerCase();
        let emailUpdateData = {};
        if (newEmail !== userToUpdate.email) {
             const existingUser = await prisma.user.findFirst({
                 where: { email: newEmail, NOT: { id: userId } }
             });
            if (existingUser) return res.status(400).json({ msg: 'Email already exists.' });
            emailUpdateData.email = newEmail;
        }

        // 'details' ko update karne wale logic ko comment out rakha hai
        /*
        const currentDetails = (userToUpdate.details || {});
        const newDetails = {
            staffId: staffId !== undefined ? staffId : currentDetails.staffId,
            contactNumber: contactNumber !== undefined ? contactNumber : currentDetails.contactNumber,
            joiningDate: joiningDate !== undefined ? (joiningDate ? new Date(joiningDate) : null) : currentDetails.joiningDate,
            leavingDate: leavingDate !== undefined ? (leavingDate ? new Date(leavingDate) : null) : currentDetails.leavingDate
        };
        */

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name,
                role: staffRole,
                ...emailUpdateData,
                // details: newDetails // <-- Commented out
            }
        });
        
        console.log(`[PUT /staff/${id}] User updated.`);

        if (req.io) {
            console.log(`[PUT /staff/${id}] Emitting events.`);
            req.io.emit('updateDashboard');
             const { password: _, ...staffDataForEmit } = updatedUser;
            req.io.emit('staff_updated', staffDataForEmit);
        } else {
             console.warn(`[PUT /staff/${id}] req.io not found.`);
        }

        const { password: __, ...userResponse } = updatedUser;
        res.json({ message: 'Staff updated.', user: userResponse });

    } catch (err) {
        console.error(`[PUT /staff/${id}] CAUGHT ERROR:`, err);
        if (err.code === 'P2002') {
             const target = err.meta?.target || [];
             if (target.includes('email')) {
                 return res.status(400).json({ msg: 'Email already exists.' });
             } else {
                 return res.status(400).json({ msg: `Unique constraint failed on ${target.join(', ')}` });
             }
        }
         if (err instanceof Prisma.PrismaClientValidationError) {
            console.error("Prisma Validation Error (Hint: Check if 'details' field exists in User schema):", err.message);
            return res.status(400).json({ msg: 'Invalid data provided. (Check schema)' });
        }
        res.status(500).send('Server Error updating staff.');
    }
});


// @route   DELETE /api/staff/:id
// @desc    Delete staff user
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, authorize('Admin')], async (req, res) => {
    const { id } = req.params;
    const schoolIdFromToken = req.user.schoolId;
    const userId = parseInt(id);
    console.log(`[DELETE /staff/${id}] Request received.`);

    if (isNaN(userId)) return res.status(400).json({ msg: 'Invalid ID.' });

    try {
        const userToDelete = await prisma.user.findFirst({
            where: { id: userId, schoolId: schoolIdFromToken }
        });
        if (!userToDelete) return res.status(404).json({ msg: 'Staff not found.' });

        await prisma.user.delete({
            where: { id: userId }
        });
        console.log(`[DELETE /staff/${id}] User deleted.`);

        if (req.io) {
             console.log(`[DELETE /staff/${id}] Emitting events.`);
            req.io.emit('updateDashboard');
            req.io.emit('staff_deleted', { id: userId, schoolId: schoolIdFromToken });
        } else {
             console.warn(`[DELETE /staff/${id}] req.io not found.`);
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


module.exports = router;
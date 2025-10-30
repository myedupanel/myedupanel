// backend/routes/staff.js
const express = require('express');
const router = express.Router();
// Mongoose aur User model hata diye
const generatePassword = require('generate-password');
const sendEmail = require('../utils/sendEmail');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma'); // Prisma client import karein
const { Prisma } = require('@prisma/client'); // Prisma types for error handling

// @route   POST /api/staff
// @desc    Add staff user
// @access  Private (Admin)
router.post('/', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    const { staffId, name, role: staffRole, contactNumber, email, joiningDate, leavingDate } = req.body;
    console.log("[POST /staff] Received data:", req.body);
    const schoolIdFromToken = req.user.schoolId;
    const schoolNameFromToken = req.user.schoolName || 'Your School'; // Yeh req.user se aana chahiye (authMiddleware se)

    if (!schoolIdFromToken) return res.status(400).json({ msg: 'Admin school info missing.' });
    if (!name || !staffRole || !email) return res.status(400).json({ msg: 'Name, Role, Email are required.' });

    // Validate staff roles (optional but recommended)
    const allowedStaffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'staff'];
    if (!allowedStaffRoles.includes(staffRole)) {
        return res.status(400).json({ msg: `Invalid role specified: ${staffRole}` });
    }

    try {
        const providedEmail = email.trim().toLowerCase(); // Ensure consistent case

        // Mongoose findOne ko Prisma findUnique se badla (email unique hai)
        const existingUser = await prisma.user.findUnique({
            where: { email: providedEmail }
        });

        if (existingUser) {
            console.log(`[POST /staff] Error: Email '${providedEmail}' exists.`);
            return res.status(400).json({ msg: 'A user account with this email already exists.' });
        }
        console.log(`[POST /staff] Email '${providedEmail}' is unique.`);

        const password = generatePassword.generate({ length: 10, numbers: true });
        // Prisma password ko automatically hash nahi karega, humein userController mein kiya tha
        // Yahaan bcryptjs import karke hash karna hoga
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log(`[POST /staff] Creating User: ${name}, Role: ${staffRole}`);

        // Mongoose new User().save() ko Prisma create se badla
        const savedUser = await prisma.user.create({
            data: {
                name: name,
                schoolId: schoolIdFromToken,
                email: providedEmail,
                password: hashedPassword, // Hashed password save karein
                role: staffRole,
                // schoolName store karne ki zaroorat nahi, relation se mil jayega
                isVerified: true, // Assuming admin created are verified
                details: { // Save staff details here (Prisma handles JSON)
                    staffId: staffId,
                    contactNumber: contactNumber,
                    joiningDate: joiningDate ? new Date(joiningDate) : null,
                    leavingDate: leavingDate ? new Date(leavingDate) : null
                }
            }
        });
        console.log(`[POST /staff] User saved. ID: ${savedUser.id}`);

        // --- Emit socket event AFTER successful save ---
        if (req.io) {
            console.log('[POST /staff] Emitting updateDashboard.');
            req.io.emit('updateDashboard');
            // Send the full saved user data (excluding password) for staff_added
            const { password: _, ...staffDataForEmit } = savedUser; // Password ko exclude karein
            console.log('[POST /staff] Emitting staff_added:', staffDataForEmit);
            req.io.emit('staff_added', staffDataForEmit);
        } else {
            console.warn('[POST /staff] req.io not found.');
        }

        // --- Optional: Send email (keep trying even if socket fails) ---
        try {
            const subject = `Your SchoolPro Staff Account at ${schoolNameFromToken}`;
            const message = `<h1>Welcome ${name},</h1><p>Account created for ${schoolNameFromToken}.</p><p>Email: ${providedEmail}</p><p>Password: ${password}</p><p>Please login and change your password.</p>`;
            await sendEmail({ to: providedEmail, subject, html: message });
            console.log(`[POST /staff] Welcome email sent to ${providedEmail}`);
        } catch (emailError) {
            console.error(`[POST /staff] Could not send welcome email:`, emailError);
            // Don't block the response for email failure
        }

        const { password: __, ...userResponse } = savedUser; // Password exclude karein
        res.status(201).json({ message: 'Staff user created.', user: userResponse });

    } catch (err) {
        console.error("[POST /staff] CAUGHT ERROR:", err);
        if (err.code === 'P2002') { // Prisma unique constraint error
             // Check karein ki kaunsa field duplicate hai (usually email)
             const target = err.meta?.target || [];
             if (target.includes('email')) {
                 return res.status(400).json({ msg: 'Email already exists.' });
             } else {
                 return res.status(400).json({ msg: `Unique constraint failed on ${target.join(', ')}` });
             }
        }
         if (err instanceof Prisma.PrismaClientValidationError) { // Prisma validation error
            return res.status(400).json({ msg: 'Invalid data provided.' });
        }
        res.status(500).send('Server Error creating staff.');
    }
});

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

        // Mongoose find().select() ko Prisma findMany({ select }) se badla
        const staffList = await prisma.user.findMany({
            where: {
                schoolId: schoolIdFromToken,
                role: { in: staffRoles }
            },
            // Select all necessary fields, including details
            select: {
                id: true,
                name: true,
                role: true,
                email: true,
                details: true,
                createdAt: true,
                schoolId: true
                // Password automatically exclude ho jaata hai agar select use karein
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[GET /staff] Found ${staffList.length} members.`);
        res.json({ data: staffList }); // Send the raw list with details

    } catch (err) {
        console.error("[GET /staff] Error:", err.message, err.stack);
        res.status(500).send('Server Error fetching staff.');
    }
});

// @route   PUT /api/staff/:id
// @desc    Update staff user
// @access  Private (Admin)
router.put('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    const { id } = req.params;
    const { staffId, name, role: staffRole, contactNumber, email, joiningDate, leavingDate } = req.body;
    const schoolIdFromToken = req.user.schoolId;
    const userId = parseInt(id); // ID ko integer mein convert karein
    console.log(`[PUT /staff/${id}] Received data:`, req.body);

    if (isNaN(userId)) return res.status(400).json({ msg: 'Invalid ID.' }); // Mongoose check ko isNaN se badla
    if (!name || !staffRole || !email) return res.status(400).json({ msg: 'Name, Role, Email required.' });

     // Validate staff roles (optional but recommended)
    const allowedStaffRoles = ['Accountant', 'Office Admin', 'Librarian', 'Security', 'Transport Staff', 'Other', 'staff'];
    if (!allowedStaffRoles.includes(staffRole)) {
        return res.status(400).json({ msg: `Invalid role specified: ${staffRole}` });
    }

    try {
        // Mongoose findOne ko Prisma findFirst se badla (authorization check ke liye)
        let userToUpdate = await prisma.user.findFirst({
            where: { id: userId, schoolId: schoolIdFromToken }
        });
        if (!userToUpdate) return res.status(404).json({ msg: 'Staff not found.' });

        const newEmail = email.trim().toLowerCase();
        let emailUpdateData = {};
        // Check email change and if new email already exists
        if (newEmail !== userToUpdate.email) {
             const existingUser = await prisma.user.findFirst({
                 where: { email: newEmail, NOT: { id: userId } }
             });
            if (existingUser) return res.status(400).json({ msg: 'Email already exists.' });
            emailUpdateData.email = newEmail; // Email ko update data mein add karein
        }

        // --- Update details object ---
        // Prisma mein JSON update karne ke liye naya object banana padta hai
        const currentDetails = (userToUpdate.details || {}); // Type assertion hata diya
        const newDetails = {
            staffId: staffId !== undefined ? staffId : currentDetails.staffId,
            contactNumber: contactNumber !== undefined ? contactNumber : currentDetails.contactNumber,
            joiningDate: joiningDate !== undefined ? (joiningDate ? new Date(joiningDate) : null) : currentDetails.joiningDate,
            leavingDate: leavingDate !== undefined ? (leavingDate ? new Date(leavingDate) : null) : currentDetails.leavingDate
        };
        // .markModified ki zaroorat nahi hai

        // Mongoose save() ko Prisma update se badla
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name,
                role: staffRole,
                ...emailUpdateData, // Email update karein agar change hua hai
                details: newDetails // Poora naya details object save karein
            }
        });
        console.log(`[PUT /staff/${id}] User updated.`);

        // --- Emit socket event AFTER save ---
        if (req.io) {
            console.log(`[PUT /staff/${id}] Emitting events.`);
            req.io.emit('updateDashboard');
             const { password: _, ...staffDataForEmit } = updatedUser; // Password exclude karein
            req.io.emit('staff_updated', staffDataForEmit);
        } else {
             console.warn(`[PUT /staff/${id}] req.io not found.`);
        }

        const { password: __, ...userResponse } = updatedUser; // Password exclude karein
        res.json({ message: 'Staff updated.', user: userResponse });

    } catch (err) {
        console.error(`[PUT /staff/${id}] CAUGHT ERROR:`, err);
        if (err.code === 'P2002') { // Prisma unique constraint error
             const target = err.meta?.target || [];
             if (target.includes('email')) {
                 return res.status(400).json({ msg: 'Email already exists.' });
             } else {
                 return res.status(400).json({ msg: `Unique constraint failed on ${target.join(', ')}` });
             }
        }
         if (err instanceof Prisma.PrismaClientValidationError) {
            return res.status(400).json({ msg: 'Invalid data provided.' });
        }
        res.status(500).send('Server Error updating staff.');
    }
});


// @route   DELETE /api/staff/:id
// @desc    Delete staff user
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, authorize('Admin')], async (req, res) => { // Role updated
    const { id } = req.params;
    const schoolIdFromToken = req.user.schoolId;
    const userId = parseInt(id); // ID ko integer mein convert karein
    console.log(`[DELETE /staff/${id}] Request received.`);

    if (isNaN(userId)) return res.status(400).json({ msg: 'Invalid ID.' }); // Mongoose check ko isNaN se badla

    try {
        // Mongoose findOne ko Prisma findFirst se badla (authorization check ke liye)
        const userToDelete = await prisma.user.findFirst({
            where: { id: userId, schoolId: schoolIdFromToken }
        });
        if (!userToDelete) return res.status(404).json({ msg: 'Staff not found.' });

        // Mongoose deleteOne ko Prisma delete se badla
        await prisma.user.delete({
            where: { id: userId }
        });
        console.log(`[DELETE /staff/${id}] User deleted.`);

        // --- Emit socket event AFTER delete ---
        if (req.io) {
             console.log(`[DELETE /staff/${id}] Emitting events.`);
            req.io.emit('updateDashboard');
            // ID bhejna kaafi hai delete event ke liye
            req.io.emit('staff_deleted', { id: userId, schoolId: schoolIdFromToken });
        } else {
             console.warn(`[DELETE /staff/${id}] req.io not found.`);
        }

        res.json({ msg: 'Staff deleted.' });

    } catch (err) {
        console.error(`[DELETE /staff/${id}] CAUGHT ERROR:`, err.message, err.stack);
        if (err.code === 'P2025') { // Prisma record not found error on delete
             return res.status(404).json({ msg: 'Staff member not found during delete.' });
        }
        res.status(500).send('Server Error deleting staff.');
    }
});


module.exports = router;
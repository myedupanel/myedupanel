// backend/controllers/userController.js

// --- 1. Imports (Updated) ---
const prisma = require('../config/prisma'); // Prisma client
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); // Naya import password hashing ke liye

// --- 2. FUNCTION 1: createUserByAdmin (Prisma Version) ---
exports.createUserByAdmin = async (req, res) => {
    // Logged-in admin ki details (req.user mein Prisma ID honi chahiye)
    const admin = req.user; // e.g., { id: 1, schoolId: "school-abc", name: "Admin" }

    // Naye user ki details
    const { name, email, role, details } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ msg: 'Please provide name, email, and role.' });
    }

    try {
        // Check karein ki user pehle se hai ya nahi
        let existingUser = await prisma.user.findUnique({ 
            where: { email: email.toLowerCase() } 
        });
        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }

        // 1. Temporary password generate karein (Same)
        const temporaryPassword = crypto.randomBytes(8).toString('hex');

        // 2. NAYA: Password ko hash karein
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

        // 3. School ka naam fetch karein (Email ke liye zaroori)
        const school = await prisma.school.findUnique({
            where: { id: admin.schoolId },
            select: { name: true }
        });
        const schoolName = school?.name || "Your School";

        // 4. Naya user database mein banayein (Prisma 'create')
        const newUser = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                role,
                password: hashedPassword, // Hash kiya hua password save karein
                schoolId: admin.schoolId,
                createdById: admin.id, // Admin ki Prisma ID
                details: details || {},
                status: 'active' 
            }
        });

        // 5. Dashboard ko update karein (Same)
        if (req.io) { 
            console.log('Emitting updateDashboard after creating user.');
            req.io.emit('updateDashboard'); 
        }

        // 6. Naye user ko email bhejein (Same)
        try {
            const subject = `Welcome to ${schoolName}! Your account is ready.`;
            const message = `
                <h1>Welcome, ${name}!</h1>
                <p>An account has been created for you at ${schoolName}.</p>
                <p>You can log in using the following credentials:</p>
                <ul>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Password:</strong> ${temporaryPassword}</li>
                </ul>
                <p>We recommend you change your password after your first login.</p>
                <br>
                <p>Regards,<br>The Admin Team</p>
            `;
            await sendEmail({ to: newUser.email, subject, html: message });
        } catch (emailError) {
            console.error("Could not send welcome email:", emailError);
            // Agar email fail ho, tab bhi response success ka dein
            return res.status(201).json({ 
                msg: `User created, but failed to send email. Please share password manually: ${temporaryPassword}` 
            });
        }
        
        // Success response
        res.status(201).json({ msg: 'User created and welcome email sent!' });

    } catch (err) {
        console.error("Error in createUserByAdmin:", err.message);
        res.status(500).send('Server Error');
    }
};

// --- Baaki functions (login, etc.) yahaan add honge ---
// module.exports = { ... }
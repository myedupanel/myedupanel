// File: backend/controllers/userController.js (CRASH FIX & SECURE)

// --- 1. Imports ---
const prisma = require('../config/prisma'); 
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); 
const { Prisma } = require('@prisma/client');

// === FIX 1: THE SANITIZER FUNCTION (XSS Prevention) ===
function removeHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '').trim(); 
}
// === END FIX 1 ===


// --- 2. FUNCTION 1: createUserByAdmin (Prisma Version) ---
// FIX: फ़ंक्शन को const के रूप में परिभाषित किया (CRASH FIX)
const createUserByAdmin = async (req, res) => {
    // Logged-in admin ki details 
    const admin = req.user; 

    // Naye user ki details (Request Body se, lekin Sanitization ke saath)
    const { name, email, role, details } = req.body;
    
    // === Sanitization (Same as previous fix plan) ===
    const sanitizedName = removeHtmlTags(name);
    const sanitizedRole = removeHtmlTags(role);
    const lowerCaseEmail = email ? email.toLowerCase() : null; 
    // ===============================================
    
    if (!sanitizedName || !lowerCaseEmail || !sanitizedRole) {
        return res.status(400).json({ msg: 'Please provide name, email, and role.' });
    }

    try {
        // Check karein ki user pehle se hai ya nahi
        let existingUser = await prisma.user.findUnique({ 
            where: { email: lowerCaseEmail } 
        });
        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }

        // 1. Temporary password generate karein (Same)
        const temporaryPassword = crypto.randomBytes(8).toString('hex');

        // 2. Password ko hash karein
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

        // 3. School ka naam fetch karein (Email ke liye zaroori)
        const school = await prisma.school.findUnique({
            where: { id: admin.schoolId },
            select: { name: true }
        });
        const schoolName = school?.name || "Your School";

        // 4. Naya user database mein banayein
        const newUser = await prisma.user.create({
            data: {
                name: sanitizedName, // Sanitized
                email: lowerCaseEmail, // Sanitized
                role: sanitizedRole, // Sanitized
                password: hashedPassword,
                schoolId: admin.schoolId,
                createdById: admin.id, 
                details: details || {},
                status: 'active' 
            }
        });

        // 5. Dashboard ko update karein (No Change)
        if (req.io) { 
            console.log('Emitting updateDashboard after creating user.');
            req.io.emit('updateDashboard'); 
        }

        // 6. Naye user ko email bhejein (No Change)
        try {
            const subject = `Welcome to ${schoolName}! Your account is ready.`;
            const message = `
                <h1>Welcome, ${sanitizedName}!</h1>
                <p>An account has been created for you at ${schoolName}.</p>
                <p>You can log in using the following credentials:</p>
                <ul>
                    <li><strong>Email:</strong> ${lowerCaseEmail}</li>
                    <li><strong>Password:</strong> ${temporaryPassword}</li>
                </ul>
                <p>We recommend you change your password after your first login.</p>
                <br>
                <p>Regards,<br>The Admin Team</p>
            `;
            await sendEmail({ to: newUser.email, subject, html: message });
        } catch (emailError) {
            console.error("Could not send welcome email:", emailError);
            return res.status(201).json({ 
                msg: `User created, but failed to send email. Please share password manually: ${temporaryPassword}` 
            });
        }
        
        // Success response
        res.status(201).json({ msg: 'User created and welcome email sent!' });

    } catch (err) {
        console.error("Error in createUserByAdmin:", err.message);
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
             return res.status(400).json({ msg: 'User with this email already exists.' });
        }
        res.status(500).send('Server Error');
    }
};

// --- Baaki functions yahaan add honge (Agar hon toh) ---

// === FIX 3: Clean Export (CRASH FIX) ===
module.exports = { 
    createUserByAdmin 
};
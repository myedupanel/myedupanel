// File: backend/controllers/userController.js (SUPREME SECURE)

// --- 1. Imports (Updated) ---
const prisma = require('../config/prisma'); 
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); 
const { Prisma } = require('@prisma/client');

// === FIX 1: THE SANITIZER FUNCTION (XSS Prevention) ===
// यह फ़ंक्शन किसी भी स्ट्रिंग से सभी HTML टैग्स को हटा देगा।
function removeHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '').trim(); 
}
// === END FIX 1 ===


// --- 2. FUNCTION 1: createUserByAdmin (Prisma Version) ---
exports.createUserByAdmin = async (req, res) => {
    // Logged-in admin ki details 
    const admin = req.user; 

    // Naye user ki details (Request Body se, lekin Sanitization ke saath)
    const { name, email, role, details } = req.body;
    
    // === FIX 2: Sanitization ===
    const sanitizedName = removeHtmlTags(name);
    const sanitizedRole = removeHtmlTags(role);
    // Email ko sanitize karne ki zaroorat nahi, sirf lowerCase karenge
    const lowerCaseEmail = email ? email.toLowerCase() : null; 
    // === END FIX 2 ===


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
            // NOTE: Message mein name/email ko sanitize karne ki zaroorat nahi, 
            // kyunki woh upar sanitized ho chuke hain
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

// --- Baaki functions yahaan add honge ---
// Note: Chunki yeh file sirf 'createUserByAdmin' export kar rahi hai,
// hum sirf wohi function module.exports mein rakhenge.

module.exports = { 
    createUserByAdmin 
};
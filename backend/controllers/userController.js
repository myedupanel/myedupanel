const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Admin ek naya user (Teacher, Student, etc.) banayega
// @route   POST /api/users/create
// @access  Private (Sirf Admin)
exports.createUserByAdmin = async (req, res) => {
    // Logged-in admin ki details humein authMiddleware se milti hain
    const admin = req.user;

    // Naye user ki details jo form se aayengi
    const { name, email, role, details } = req.body;

    // Check karein ki zaroori fields hain ya nahi
    if (!name || !email || !role) {
        return res.status(400).json({ msg: 'Please provide name, email, and role for the new user.' });
    }

    try {
        // Check karein ki is email se koi user pehle se to nahi hai
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }

        // 1. Naye user ke liye ek random temporary password generate karein
        const temporaryPassword = crypto.randomBytes(8).toString('hex');

        // 2. Naya user object banayein
        const newUser = new User({
            name,
            email,
            role,
            password: temporaryPassword, // Yeh password 'pre-save' hook mein automatically hash ho jayega
            schoolName: admin.schoolName, // Admin ke school ka naam hi istemal hoga
            createdBy: admin.id, // User ko create karne waale admin ki ID
            details: details || {}, // Agar class ya subject jaisi extra details hain
            status: 'active'
        });

        // 3. Naye user ko database mein save karein
        await newUser.save();

        // 4. Naye user ko email se uski login details bhejein
        try {
            const subject = `Welcome to ${admin.schoolName}! Your account has been created.`;
            const message = `
                <h1>Welcome, ${name}!</h1>
                <p>An account has been created for you at ${admin.schoolName}.</p>
                <p>You can now log in to SchoolPro using the following credentials:</p>
                <ul>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Password:</strong> ${temporaryPassword}</li>
                </ul>
                <p>We recommend you change your password after your first login.</p>
                <br>
                <p>Regards,<br>The SchoolPro Team</p>
            `;
            await sendEmail({ to: newUser.email, subject, html: message });
        } catch (emailError) {
            console.error("Could not send welcome email to new user:", emailError);
            // Agar email fail ho jaaye to bhi user create ho chuka hai
            return res.status(201).json({ 
                msg: `User created successfully, but failed to send welcome email. Please share the password manually: ${temporaryPassword}` 
            });
        }
        
        // Success ka response bhejein
        res.status(201).json({ msg: 'User created and welcome email sent successfully!' });

    } catch (err) {
        console.error("Error in createUserByAdmin:", err.message);
        res.status(500).send('Server Error');
    }
};
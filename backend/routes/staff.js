// routes/staff.js
const express = require('express');
const router = express.Router();
// --- Imports needed ---
const User = require('../models/User'); // To create the User account
const generatePassword = require('generate-password'); // To create a temporary password
const sendEmail = require('../utils/sendEmail'); // To optionally send login details
const { authMiddleware, authorize } = require('../middleware/authMiddleware'); // For security

// @route   POST /api/staff
// @desc    Add a new staff member AND create their User account
// @access  Private (Admin only)
router.post('/', [authMiddleware, authorize('admin')], async (req, res) => {
    // --- Get staff details from request body ---
    // Adjust these fields based on your actual staff form
    const { staffId, name, role: staffRole, contactNumber, email, joiningDate } = req.body;
    console.log("[POST /staff] Received data:", req.body);

    // --- Get schoolId from token ---
    const schoolIdFromToken = req.user.schoolId;
    if (!schoolIdFromToken) {
        console.log("[POST /staff] Error: Missing schoolId.");
        return res.status(400).json({ msg: 'Admin school information is missing. Cannot add staff.' });
    }

    // --- Basic Validation (Add more as needed) ---
    if (!staffId || !name || !staffRole || !email) {
        console.log("[POST /staff] Error: Missing required fields.");
        return res.status(400).json({ msg: 'Please provide Staff ID, Name, Role, and Email.' });
    }

    try {
        // --- Check duplicate User (by email) ---
        // User email must be globally unique
        const providedEmail = email.trim();
        let existingUser = await User.findOne({ email: providedEmail });
        if (existingUser) {
            console.log(`[POST /staff] Error: User with email '${providedEmail}' already exists.`);
            return res.status(400).json({ msg: 'A user account with this email already exists.' });
        }
        console.log(`[POST /staff] Email '${providedEmail}' is unique.`);

        // --- Generate Temporary Password ---
        const password = generatePassword.generate({ length: 10, numbers: true });

        // --- Create the User document ---
        console.log(`[POST /staff] Creating User document for staff: ${name}`);
        const newUser = new User({
            name: name, // Staff member's name
            schoolId: schoolIdFromToken,
            email: providedEmail, // Staff email is required for User account
            password: password, // Pre-save hook will hash
            role: 'staff',      // Set role to 'staff'
            isVerified: true    // Assume admin-created staff are verified
        });
        await newUser.save(); // Save the User document
        console.log(`[POST /staff] User document saved with ID: ${newUser._id}`);

        // --- Optional: Create a separate Staff document ---
        // If you need to store more staff-specific details (like joiningDate, qualifications etc.)
        // Create a models/Staff.js file similar to Student.js or Teacher.js
        // const Staff = require('../models/Staff'); // Import if you create it
        // const newStaffMember = new Staff({
        //     staffId, name, role: staffRole, contactNumber, email: providedEmail, joiningDate,
        //     schoolId: schoolIdFromToken,
        //     userId: newUser._id // Link to the User account
        // });
        // await newStaffMember.save();
        // console.log(`[POST /staff] Staff document saved with ID: ${newStaffMember._id}`);
        // --- End Optional Staff document ---


        // --- Optional: Send login details email ---
        try {
            const subject = 'Your SchoolPro Staff Account Details';
            const message = `<h1>Welcome to SchoolPro, ${name}!</h1><p>An account has been created for you.</p><p>Login details:</p><ul><li><strong>Login Email:</strong> ${providedEmail}</li><li><strong>Temporary Password:</strong> ${password}</li></ul><p>Please change the password after the first login.</p>`;
            await sendEmail({ to: providedEmail, subject, html: message });
            console.log(`[POST /staff] Welcome email sent to ${providedEmail}`);
        } catch (emailError) {
            console.error(`[POST /staff] Could not send welcome email to ${providedEmail}:`, emailError);
            // Don't fail the request if email fails, maybe return partial success
            // return res.status(201).json({ message: 'Staff user created, but email failed.', userId: newUser._id });
        }

        // --- Emit socket event for dashboard update ---
        if (req.io) {
            console.log("[POST /staff] Emitting socket events...");
            req.io.emit('updateDashboard'); // Trigger dashboard refresh
            // Optionally emit specific staff added event, sending newUser or newStaffMember data
            // req.io.emit('staff_added', newUser);
        } else {
            console.warn('[POST /staff] Socket.IO instance (req.io) not found on request object.');
        }

        // --- Send Success Response ---
        // Send back the user ID or the full user object (excluding password)
        res.status(201).json({ message: 'Staff user account created successfully', userId: newUser._id });
        // If you created a separate Staff document, you might send that instead:
        // res.status(201).json({ message: 'Staff member and user account created successfully', staff: newStaffMember });

    } catch (err) {
        // Handle potential duplicate errors from User (email)
        if (err.code === 11000 && err.keyPattern?.email) {
            console.error(`[POST /staff] Duplicate email error:`, err);
            return res.status(400).json({ msg: 'A user account with the provided email already exists.' });
        }
        // Handle validation errors (e.g., missing fields)
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            console.error(`[POST /staff] Validation Error:`, messages);
            return res.status(400).json({ msg: messages.join(' ') });
        }
        // Log other errors
        console.error("[POST /staff] CATCH BLOCK Error:", err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

// --- TODO: Add other staff routes later ---
// GET /api/staff - To get all staff for the school
// GET /api/staff/:id - To get a single staff member
// PUT /api/staff/:id - To update staff details (and maybe linked User name)
// DELETE /api/staff/:id - To delete staff (and linked User account)

module.exports = router; // Export the router
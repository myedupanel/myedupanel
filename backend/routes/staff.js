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
        console.log(`[POST /staff] User document saved with ID: ${newUser._id}`); // This log confirms save was successful

        // --- Optional: Create a separate Staff document ---
        // (Keep this commented out unless you have models/Staff.js)
        // const Staff = require('../models/Staff');
        // const newStaffMember = new Staff({ /* ... staff details ... */ });
        // await newStaffMember.save();
        // --- End Optional Staff document ---


        // --- Optional: Send login details email ---
        try {
            const subject = 'Your SchoolPro Staff Account Details';
            const message = `<h1>Welcome...</h1><p>Email: ${providedEmail}</p><p>Password: ${password}</p>`;
            await sendEmail({ to: providedEmail, subject, html: message });
            console.log(`[POST /staff] Welcome email sent to ${providedEmail}`);
        } catch (emailError) {
            console.error(`[POST /staff] Could not send welcome email to ${providedEmail}:`, emailError);
            // Decide if you want to proceed even if email fails
        }

        // --- Emit socket event for dashboard update ---
        if (req.io) {
            console.log("[POST /staff] Emitting socket events...");
            req.io.emit('updateDashboard'); // Trigger dashboard refresh
            // req.io.emit('staff_added', newUser); // Optionally send new user data
        } else {
            console.warn('[POST /staff] Socket.IO instance (req.io) not found on request object.');
        }

        // --- Send Success Response ---
        res.status(201).json({ message: 'Staff user account created successfully', userId: newUser._id });
        // If using Staff model: res.status(201).json({ message: 'Staff member created...', staff: newStaffMember });

    } catch (err) {
        // --- ADDED DETAILED LOGGING HERE ---
        console.error("[POST /staff] CAUGHT ERROR:", err); // Log the entire error object
        console.error("[POST /staff] Error Name:", err.name); // Log error type
        console.error("[POST /staff] Error Message:", err.message); // Log error message
        console.error("[POST /staff] Error Code:", err.code); // Log error code if available (like 11000)
        console.error("[POST /staff] Error KeyPattern:", err.keyPattern); // Log keyPattern if available (for duplicates)
        // --- END ADDED LOGS ---

        // Handle potential duplicate errors from User (email)
        if (err.code === 11000 && err.keyPattern?.email) {
            // console.error(`[POST /staff] Duplicate email error:`, err); // Already logged above
            return res.status(400).json({ msg: 'A user account with the provided email already exists.' });
        }
        // Handle validation errors (e.g., missing fields)
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            // console.error(`[POST /staff] Validation Error:`, messages); // Already logged above
            return res.status(400).json({ msg: messages.join(' ') });
        }
        // Log other errors (already logged above)
        // console.error("[POST /staff] CATCH BLOCK Error:", err.message, err.stack); // Covered by detailed logs now
        res.status(500).send('Server Error');
    }
});

// --- TODO: Add other staff routes later (GET, PUT, DELETE) ---

module.exports = router; // Export the router
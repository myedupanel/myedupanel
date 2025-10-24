const express = require('express');
const router = express.Router();
const Parent = require('../models/Parent');
const Student = require('../models/Student'); // Student model imported
// --- NEW: Add imports needed for User creation ---
const User = require('../models/User');
const generatePassword = require('generate-password');
const sendEmail = require('../utils/sendEmail');
// --- End Imports ---
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// @route   GET api/parents
// @desc    Get all parents for the admin's school
// @access  Private (Admin)
// --- Uses auth and schoolId filter ---
router.get('/', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    const schoolIdFromToken = req.user.schoolId;
    if (!schoolIdFromToken) {
        return res.status(400).json({ msg: 'School information missing from token.' });
    }
    const parents = await Parent.find({ schoolId: schoolIdFromToken })
      .populate('studentId', 'name class')
      .sort({ createdAt: -1 });
    res.json(parents);
  } catch (err) {
    console.error("Error fetching parents:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/parents
// @desc    Add new parent & create User account
// @access  Private (Admin)
// --- UPDATED: To create User account ---
router.post('/', [authMiddleware, authorize('admin')], async (req, res) => {
  const { name, contactNumber, email, occupation, studentId } = req.body;
  const schoolIdFromToken = req.user.schoolId;

  // Basic validation
  if (!name || !contactNumber || !email || !studentId) {
       return res.status(400).json({ msg: 'Please provide Name, Contact, Email, and select a Student.' });
  }
  if (!schoolIdFromToken) {
      return res.status(400).json({ msg: 'Admin school information missing.' });
  }

  try {
    // 1. Check if studentId is valid and belongs to the *same school*
    const studentExists = await Student.findOne({ _id: studentId, schoolId: schoolIdFromToken });
    if (!studentExists) {
      return res.status(404).json({ msg: 'Selected student not found in your school.' });
    }

    // 2. Check if a User with this email already exists ANYWHERE
    // (User email must be globally unique)
    let existingUser = await User.findOne({ email });
    if (existingUser) {
        // Important: Even if a user exists, check if a Parent record *for this school* also exists.
        let existingParentInSchool = await Parent.findOne({ email, schoolId: schoolIdFromToken });
        if (existingParentInSchool) {
            return res.status(400).json({ msg: 'A parent with this email already exists in this school.' });
        } else {
            // User exists but maybe as a teacher, student, or parent in another school.
            // Decide policy: Allow creating Parent record but link to existing User? Or block?
            // For now, let's block to keep it simple and avoid potential role conflicts.
            return res.status(400).json({ msg: `A user account (role: ${existingUser.role}) with this email already exists.` });
        }
    }

    // 3. Generate Temporary Password
    const password = generatePassword.generate({ length: 10, numbers: true });

    // 4. Create the User document for the parent
    console.log(`[POST /parents] Creating User document for parent: ${name}`);
    const newUser = new User({
        name: name, // Parent's name
        schoolId: schoolIdFromToken,
        email: email, // Parent's email is required here
        password: password, // Pre-save hook will hash
        role: 'parent',
        isVerified: true // Assume admin-created parents are verified
    });
    await newUser.save(); // Save the User document
    console.log(`[POST /parents] User document saved with ID: ${newUser._id}`);


    // 5. Create new Parent document, including schoolId and userId
    console.log(`[POST /parents] Creating Parent document for: ${name}`);
    const parent = new Parent({
        name,
        contactNumber,
        email,
        occupation,
        studentId,
        schoolId: schoolIdFromToken,
        userId: newUser._id // Link to the created User account
    });
    await parent.save(); // Save the Parent document
     console.log(`[POST /parents] Parent document saved with ID: ${parent._id}`);

    // 6. Optional: Send login details email to parent
    try {
        const subject = 'Your SchoolPro Parent Account Details';
        const message = `
            <h1>Welcome to SchoolPro, ${name}!</h1>
            <p>An account has been created for you.</p>
            <p>Login details:</p>
            <ul>
                <li><strong>Login Email:</strong> ${email}</li>
                <li><strong>Temporary Password:</strong> ${password}</li>
            </ul>
            <p>Please change the password after the first login.</p>
        `;
        await sendEmail({ to: email, subject, html: message });
        console.log(`[POST /parents] Welcome email sent to ${email}`);
    } catch (emailError) {
        console.error(`[POST /parents] Could not send welcome email to ${email}:`, emailError);
        // Don't fail the request if email fails
    }

    // 7. Emit socket event to update dashboard count
    if (req.io) {
        console.log("[POST /parents] Emitting socket events...");
        req.io.emit('updateDashboard'); // Trigger dashboard refresh
        // Optionally emit specific parent added event
        // req.io.emit('parent_added', newParentPopulated);
    } else {
        console.warn('[POST /parents] Socket.IO instance not found.');
    }

    // 8. Populate and send response
    const newParentPopulated = await Parent.findById(parent._id).populate('studentId', 'name class');
    res.status(201).json(newParentPopulated);

  } catch (err) {
    console.error("Error creating parent:", err.message, err.stack);
     // Handle potential duplicate key error (User email unique index)
     if (err.code === 11000 && err.keyPattern?.email) {
        return res.status(400).json({ msg: 'A user account with this email already exists.' });
     }
      // Handle Parent validation errors
     if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ msg: messages.join(' ') });
     }
    res.status(500).send('Server Error');
  }
});
// --- END UPDATE ---

// @route   PUT api/parents/:id
// @desc    Update a parent by ID (for admin's school)
// @access  Private (Admin)
// --- Uses auth and ensures parent belongs to school ---
router.put('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
    const { studentId, name } = req.body; // Get name if provided
    const schoolIdFromToken = req.user.schoolId;

    try {
        let parentToUpdate = await Parent.findById(req.params.id);
        if (!parentToUpdate) return res.status(404).json({ msg: 'Parent not found' });
        if (parentToUpdate.schoolId.toString() !== schoolIdFromToken) return res.status(403).json({ msg: 'Not authorized to update this parent.' });

        // Optional: Validate new studentId if provided
        if (studentId) { /* ... validation ... */ }

        // Prevent changing schoolId or email directly on Parent if linked to User
        const updateData = { ...req.body };
        delete updateData.schoolId;
        delete updateData.email; // Email change should likely happen via User model/profile page

        const updatedParent = await Parent.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true })
                                         .populate('studentId', 'name class');

        // Optional: Update linked User's name if parent name changed
        if (name && parentToUpdate.userId) {
            await User.findByIdAndUpdate(parentToUpdate.userId, { $set: { name: name } });
            console.log(`[PUT /parents] Updated linked User name for parent ID: ${parentToUpdate._id}`);
        }

        // Optional: Socket emit for real-time update
        // if (req.io) { req.io.emit('parent_updated', updatedParent); }

        res.json(updatedParent);
    } catch (err) { console.error("Error updating parent:", err.message); res.status(500).send('Server Error'); }
});

// @route   DELETE api/parents/:id
// @desc    Delete a parent by ID (AND their User account)
// @access  Private (Admin)
// --- UPDATED: To delete User account ---
router.delete('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    const parentToDelete = await Parent.findById(req.params.id);
    if (!parentToDelete) return res.status(404).json({ msg: 'Parent not found' });
    if (parentToDelete.schoolId.toString() !== req.user.schoolId) return res.status(403).json({ msg: 'Not authorized to delete this parent.' });

    const parentEmail = parentToDelete.email;
    const linkedUserId = parentToDelete.userId; // Get linked User ID

    // --- Delete the associated User account first (by ID or Email) ---
    let userDeleted = false;
    if (linkedUserId) {
        const deletedUserById = await User.findOneAndDelete({ _id: linkedUserId, role: 'parent' });
        if (deletedUserById) {
            console.log(`[DELETE /parents] Deleted linked user account by ID: ${linkedUserId}`);
            userDeleted = true;
        } else {
            console.log(`[DELETE /parents] Linked User account not found for ID: ${linkedUserId}. Might be already deleted or role mismatch.`);
        }
    }
    // Fallback to email if userId wasn't linked or didn't delete
    if (!userDeleted && parentEmail) {
        const deletedUserByEmail = await User.findOneAndDelete({ email: parentEmail, role: 'parent' });
         if (deletedUserByEmail) {
            console.log(`[DELETE /parents] Deleted user account by email: ${parentEmail}`);
            userDeleted = true;
         } else {
              console.log(`[DELETE /parents] User account not found for email: ${parentEmail} (role: parent).`);
         }
    }
     if (!userDeleted) {
         console.log(`[DELETE /parents] Could not find associated User account for parent ID: ${req.params.id}`);
     }
     // --- End User Deletion ---

    // Delete the parent document
    await Parent.findByIdAndDelete(req.params.id);
     console.log(`[DELETE /parents] Deleted parent document: ${req.params.id}`);

    // Emit socket event to update dashboard count
    if (req.io) {
        console.log("[DELETE /parents] Emitting socket events...");
        req.io.emit('updateDashboard');
        // Optionally emit specific parent deleted event
        // req.io.emit('parent_deleted', req.params.id);
    } else {
         console.warn('[DELETE /parents] Socket.IO instance not found.');
    }

    res.json({ msg: 'Parent removed successfully' });
  } catch (err) {
    console.error("Error deleting parent:", err.message, err.stack);
    res.status(500).send('Server Error');
  }
});
// --- END UPDATE ---

module.exports = router;
const express = require('express');
const router = express.Router();
const Parent = require('../models/Parent');
const Student = require('../models/Student'); // Student model imported
// --- NEW: Import middleware ---
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
// --- END NEW ---

// @route   GET api/parents
// @desc    Get all parents for the admin's school
// @access  Private (Admin)
// --- UPDATED: Added middleware and schoolId filter ---
router.get('/', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    const schoolIdFromToken = req.user.schoolId;
    if (!schoolIdFromToken) {
        return res.status(400).json({ msg: 'School information missing from token.' });
    }

    const parents = await Parent.find({ schoolId: schoolIdFromToken }) // Filter by schoolId
      .populate('studentId', 'name class') // Keep populate
      .sort({ createdAt: -1 });
    res.json(parents);
  } catch (err) {
    console.error("Error fetching parents:", err.message);
    res.status(500).send('Server Error');
  }
});
// --- END UPDATE ---

// @route   POST api/parents
// @desc    Add a new parent for the admin's school
// @access  Private (Admin)
// --- UPDATED: Added middleware and schoolId saving ---
router.post('/', [authMiddleware, authorize('admin')], async (req, res) => {
  const { name, contactNumber, email, occupation, studentId } = req.body;
  // --- NEW: Get schoolId from token ---
  const schoolIdFromToken = req.user.schoolId;
  if (!schoolIdFromToken) {
      return res.status(400).json({ msg: 'Admin school information missing.' });
  }
  // --- END NEW ---

  try {
    // Check if studentId is valid and belongs to the *same school*
    const studentExists = await Student.findOne({ _id: studentId, schoolId: schoolIdFromToken });
    if (!studentExists) {
      return res.status(404).json({ msg: 'Selected student not found in your school.' });
    }

    // Check if parent email already exists *within the same school*
    let parent = await Parent.findOne({ email, schoolId: schoolIdFromToken });
    if (parent) {
      return res.status(400).json({ msg: 'A parent with this email already exists in this school.' });
    }

    // Create new parent, including schoolId
    parent = new Parent({
        name,
        contactNumber,
        email,
        occupation,
        studentId,
        schoolId: schoolIdFromToken // <-- Save schoolId here
    });
    await parent.save();

    // Populate and send response
    const newParent = await Parent.findById(parent._id).populate('studentId', 'name class');
    res.status(201).json(newParent);

  } catch (err) {
    console.error("Error creating parent:", err.message);
     // Handle potential duplicate key error (email + schoolId index)
     if (err.code === 11000) {
        return res.status(400).json({ msg: 'Database error: A parent with this email might already exist in this school.' });
     }
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
// --- UPDATED: Added middleware and authorization check ---
router.put('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
    const { studentId } = req.body; // Get studentId if provided in update
    const schoolIdFromToken = req.user.schoolId;

    try {
        // Find the parent to update
        let parentToUpdate = await Parent.findById(req.params.id);
        if (!parentToUpdate) {
            return res.status(404).json({ msg: 'Parent not found' });
        }
        // Ensure parent belongs to the admin's school
        if (parentToUpdate.schoolId.toString() !== schoolIdFromToken) {
            return res.status(403).json({ msg: 'Not authorized to update this parent.' });
        }

        // Optional: Validate new studentId if provided
        if (studentId) {
            const studentExists = await Student.findOne({ _id: studentId, schoolId: schoolIdFromToken });
            if (!studentExists) {
                return res.status(404).json({ msg: 'Selected student not found in your school.' });
            }
        }

        // Prevent changing schoolId via update
        const updateData = { ...req.body };
        delete updateData.schoolId;
        // Optionally prevent changing email if it should be immutable or handled differently
        // delete updateData.email;

        // Perform the update
        const updatedParent = await Parent.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true })
                                         .populate('studentId', 'name class');

        res.json(updatedParent);
    } catch (err) {
        console.error("Error updating parent:", err.message);
        // Handle potential errors like duplicate email if email is updated
        if (err.code === 11000) {
           return res.status(400).json({ msg: 'Update failed: Email might already be in use within this school.' });
        }
        res.status(500).send('Server Error');
    }
});
// --- END UPDATE ---

// @route   DELETE api/parents/:id
// @desc    Delete a parent by ID (for admin's school)
// @access  Private (Admin)
// --- UPDATED: Added middleware and authorization check ---
router.delete('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    const parentToDelete = await Parent.findById(req.params.id);
    if (!parentToDelete) {
      return res.status(404).json({ msg: 'Parent not found' });
    }
    // Ensure parent belongs to the admin's school
    if (parentToDelete.schoolId.toString() !== req.user.schoolId) {
        return res.status(403).json({ msg: 'Not authorized to delete this parent.' });
    }

    // Delete the parent
    await Parent.findByIdAndDelete(req.params.id);

    // Optional: Emit socket event if needed for real-time updates on parent lists
    // if (req.io) { req.io.emit('parent_deleted', req.params.id); }

    res.json({ msg: 'Parent removed successfully' });
  } catch (err) {
    console.error("Error deleting parent:", err.message);
    res.status(500).send('Server Error');
  }
});
// --- END UPDATE ---

module.exports = router;
// routes/dashboard.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // <-- Make sure mongoose is imported
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   GET /api/dashboard/stats
// @desc    Dashboard ke liye saare stats fetch karein
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Safety Check: Ensure user and user.id exist
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Authorization denied, user not found' });
    }
    const schoolId = req.user.id;

    // --- THIS IS THE FIX ---
    // Check if the schoolId is a valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
        return res.status(400).json({ msg: 'Invalid School ID' });
    }
    // Convert the string ID to a MongoDB ObjectId
    const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      studentsByClass
    ] = await Promise.all([
      Student.countDocuments({ schoolId: schoolObjectId }),
      Teacher.countDocuments({ schoolId: schoolObjectId }),
      Class.countDocuments({ schoolId: schoolObjectId }),
      Student.aggregate([
        { $match: { schoolId: schoolObjectId } }, // Use the safe, converted ID
        { $group: { _id: '$class', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);
    
    // Assemble data into the format the frontend needs
    const responseData = {
      stats: [
        { title: "Total Students", value: totalStudents.toString() },
        { title: "Total Teachers", value: totalTeachers.toString() },
        { title: "Monthly Revenue", value: "₹0" }, // Placeholder
        { title: "Total Parents", value: "0" },    // Placeholder
        { title: "Total Staff", value: "0" },      // Placeholder
        { title: "Total Classes", value: totalClasses.toString() }
      ],
      admissionData: studentsByClass.map(item => ({ name: item._id, admissions: item.count })),
      recentPayments: [] // Placeholder
    };

    res.json(responseData);

  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
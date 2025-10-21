const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/students
// @desc    Naya student add karein (Sirf apne school mein)
router.post('/', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    const { studentId, name, class: studentClass, rollNo, parentName, parentContact } = req.body;

    // Zaroori fields check karein
    if (!studentId || !name || !studentClass || !rollNo) {
        return res.status(400).json({ msg: 'Please provide Student ID, Name, Class, and Roll No.' });
    }

    // Check karein ki is school mein yeh studentId pehle se to nahi hai
    let student = await Student.findOne({ studentId, schoolId: req.user.id });
    if (student) {
      return res.status(400).json({ msg: 'A student with this ID already exists in your school.' });
    }

    // Naya student banayein aur usse logged-in admin ki ID (schoolId) se jodein
    student = new Student({
      studentId,
      name,
      class: studentClass,
      rollNo,
      parentName,
      parentContact,
      schoolId: req.user.id // Security: schoolId hamesha trusted token se aayegi
    });

    await student.save();
    res.status(201).json({ message: 'Student added successfully', student });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/students
// @desc    Apne school ke saare students ki list paayein
router.get('/', [authMiddleware, authorize('admin', 'teacher')], async (req, res) => {
  try {
    // Sirf woh students dhoondhein jinka schoolId logged-in user ki ID se match karta hai
    const students = await Student.find({ schoolId: req.user.id }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/students/:id
// @desc    Ek student ko update karein (Sirf apne school ke)
router.put('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Security check: Kya yeh student issi admin ke school ka hai?
    if (student.schoolId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to edit this student' });
    }

    student = await Student.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ msg: 'Student details updated successfully', student });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/students/:id
// @desc    Ek student ko delete karein (Sirf apne school ke)
router.delete('/:id', [authMiddleware, authorize('admin')], async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Security check: Kya yeh student issi admin ke school ka hai?
    if (student.schoolId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this student' });
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Student removed successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
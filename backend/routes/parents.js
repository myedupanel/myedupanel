const express = require('express');
const router = express.Router();
const Parent = require('../models/Parent');
const Student = require('../models/Student'); // <-- Student model ko import karein

// @route   GET api/parents
// @desc    Saare parents ki list unke student ke naam ke saath paayein
router.get('/', async (req, res) => {
  try {
    const parents = await Parent.find()
      .populate('studentId', 'name class')
      .sort({ createdAt: -1 });
    res.json(parents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/parents
// @desc    Naya parent add karein (WITH VALIDATION)
router.post('/', async (req, res) => {
  const { name, contactNumber, email, occupation, studentId } = req.body;
  try {
    // --- NAYA VALIDATION CODE ---
    // Check karein ki studentId valid hai ya nahi
    const studentExists = await Student.findById(studentId);
    if (!studentExists) {
      return res.status(404).json({ msg: 'Selected student not found in database.' });
    }
    // ----------------------------

    let parent = await Parent.findOne({ email });
    if (parent) {
      return res.status(400).json({ msg: 'Is email ka parent pehle se hai' });
    }
    
    parent = new Parent({ name, contactNumber, email, occupation, studentId });
    await parent.save();
    
    // Response mein populated data bhejein taaki UI turant update ho sake
    const newParent = await Parent.findById(parent._id).populate('studentId', 'name class');
    res.status(201).json(newParent);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/parents/:id
// @desc    Ek parent ko uski ID se update karein
router.put('/:id', async (req, res) => {
    const { studentId } = req.body;
    try {
        // Optional: Yahan bhi studentId validation add kar sakte hain
        if (studentId) {
            const studentExists = await Student.findById(studentId);
            if (!studentExists) {
                return res.status(404).json({ msg: 'Selected student not found.' });
            }
        }

        const parent = await Parent.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
                                   .populate('studentId', 'name class');
        if (!parent) {
            return res.status(404).json({ msg: 'Parent not found' });
        }
        res.json(parent);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/parents/:id
// @desc    Ek parent ko uski ID se delete karein
router.delete('/:id', async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({ msg: 'Parent not found' });
    }
    await Parent.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Parent removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
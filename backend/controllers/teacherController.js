const Teacher = require('../models/Teacher');
const User = require('../models/User'); // User model ko bhi import karein, delete ke liye zaroori hai

// Alag-alag possible header naamon ko hamare sahi keys se map karein
const headerMappings = {
  teacherId: ['teacherid', 'id', 'employee id', 'employeeid'],
  name: ['name', 'teacher name', 'teachername', 'full name'],
  subject: ['subject', 'subjects'],
  contactNumber: ['contactnumber', 'contact no', 'phone', 'mobile'],
  email: ['email', 'email id', 'emailaddress'],
};

// Yeh function CSV ke header ko saaf karke sahi key dhoondhta hai
function getCanonicalKey(header) {
  if (!header) return null;
  const normalizedHeader = header.toLowerCase().replace(/[\s_-]/g, ''); // "Teacher Name" -> "teachername"
  for (const key in headerMappings) {
    if (headerMappings[key].includes(normalizedHeader)) {
      return key; // Sahi key mil gayi (e.g., 'name')
    }
  }
  return null; // Agar koi match na mile
}

// @desc    CSV/Excel se teachers ko bulk mein add karein
// @route   POST /api/teachers/bulk
const addTeachersInBulk = async (req, res) => {
  try {
    const teachersData = req.body;
    if (!teachersData || !Array.isArray(teachersData)) {
      return res.status(400).json({ message: 'No data provided.' });
    }

    // Har row ko process karke saaf-suthra data banayein
    const processedTeachers = teachersData.map(row => {
      const newTeacher = {};
      for (const rawHeader in row) {
        const canonicalKey = getCanonicalKey(rawHeader); // Sahi key dhoondhein
        if (canonicalKey) {
          // Extra spaces (shuru aur aakhir mein) ko saaf karein
          const value = row[rawHeader];
          newTeacher[canonicalKey] = typeof value === 'string' ? value.trim() : value;
        }
      }
      return newTeacher;
    });

    // Sirf un teachers ko lein jinmein zaroori details (teacherId aur name) hain
    const validTeachers = processedTeachers.filter(t => t.teacherId && t.name && t.email);

    if (validTeachers.length === 0) {
      return res.status(400).json({ message: 'File has no valid teacher data. Please check headers for teacherId, name, and email.' });
    }

    // ordered: false se agar ek teacher fail ho, toh baaki add ho jaayenge
    const createdTeachers = await Teacher.insertMany(validTeachers, { ordered: false });
    
    res.status(201).json({ message: `${createdTeachers.length} teachers were added successfully!` });
  } catch (error) {
    console.error("Error during bulk teacher import:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate Teacher ID or Email found. Some teachers may not have been imported.' });
    }
    res.status(500).json({ message: 'Server error during import.' });
  }
};

// @desc    Saare teachers ki list paayein
// @route   GET /api/teachers
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Baaki ke functions (add, update, delete) aapki routes/teachers.js file mein hain
// Agar aap unhe yahan laana chahte hain, toh unka code yahan copy-paste kar sakte hain.

module.exports = {
  addTeachersInBulk,
  getAllTeachers,
  // ... baaki functions agar aap yahan move karte hain
};
const Student = require('../models/Student');

const headerMappings = {
  name: ['name', 'student name', 'studentname', 'full name', 'fullname'],
  class: ['class', 'grade', 'standard', 'std', 'class number'],
  rollNo: ['rollno', 'roll no', 'roll number', 'rollnumber', 'roll'],
  parentName: ['parentname', 'parent name', 'father name', 'fathername', 'guardian name', 'guardian', 'parents name'],
  parentContact: ['parentcontact', 'parent contact', 'contact', 'phone', 'mobile', 'contact number', 'mobile no']
};

function getCanonicalKey(header) {
  if (!header) return null;
  const normalizedHeader = header.toLowerCase().replace(/[\s_-]/g, '');
  for (const key in headerMappings) {
    if (headerMappings[key].includes(normalizedHeader)) {
      return key;
    }
  }
  return null;
}

const addStudentsInBulk = async (req, res) => {
  try {
    const studentsData = req.body;
    if (!studentsData || !Array.isArray(studentsData)) {
      return res.status(400).json({ message: 'No student data provided.' });
    }

    const processedStudents = studentsData.map(row => {
      const newStudent = {};
      for (const rawHeader in row) {
        const canonicalKey = getCanonicalKey(rawHeader);
        if (canonicalKey) {
          const value = row[rawHeader];
          newStudent[canonicalKey] = typeof value === 'string' ? value.trim() : value;
        }
      }
      return newStudent;
    });
    
    // Filter for students who have the minimum required fields
    const validStudents = processedStudents.filter(s => s.name && s.class && s.rollNo);
    
    if (validStudents.length === 0) {
      console.log("--- Data After Mapping (No Valid Students Found) ---");
      console.log(JSON.stringify(processedStudents, null, 2));
      return res.status(400).json({ message: 'No valid student data found. Please ensure your file has columns for at least name, class, and rollNo.' });
    }

    const createdStudents = await Student.insertMany(validStudents, { ordered: false });

    res.status(201).json({
      message: `${createdStudents.length} students were added successfully!`,
    });

  } catch (error) {
    console.error("---!!!--- CRITICAL ERROR DURING BULK IMPORT ---!!!---");
    console.error(error);
    if (error.code === 11000) {
        return res.status(400).json({ message: 'Duplicate roll number found. Some students were not imported.' });
    }
    res.status(500).json({ message: 'Server error while importing students.' });
  }
};

const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().sort({ class: 1, name: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

module.exports = {
  addStudentsInBulk,
  getAllStudents,
  // ... other controller functions
};
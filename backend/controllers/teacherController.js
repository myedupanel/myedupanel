// File: backend/controllers/teacherController.js

// --- 1. Imports ---
// Puraane models (Teacher, User) ko hatayein
const prisma = require('../config/prisma'); // Naya Prisma client import karein

// --- 2. Header Mappings ---
// Isme koi badlaav nahi, yeh bilkul sahi hai
const headerMappings = {
  teacherId: ['teacherid', 'id', 'employee id', 'employeeid'],
  name: ['name', 'teacher name', 'teachername', 'full name'],
  subject: ['subject', 'subjects'],
  contactNumber: ['contactnumber', 'contact no', 'phone', 'mobile'],
  email: ['email', 'email id', 'emailaddress'],
};

// --- 3. Helper Function ---
// Isme bhi koi badlaav nahi
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

// --- 4. FUNCTION 1: addTeachersInBulk (Prisma Version) ---
const addTeachersInBulk = async (req, res) => {
  try {
    // NAYA: School ID ko req.user se lein
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID.' });
    }

    const teachersData = req.body;
    if (!teachersData || !Array.isArray(teachersData)) {
      return res.status(400).json({ message: 'No data provided.' });
    }

    // ProcessedTeachers (Same code)
    const processedTeachers = teachersData.map(row => {
      const newTeacher = {};
      for (const rawHeader in row) {
        const canonicalKey = getCanonicalKey(rawHeader);
        if (canonicalKey) {
          const value = row[rawHeader];
          newTeacher[canonicalKey] = typeof value === 'string' ? value.trim() : value;
        }
      }
      return newTeacher;
    });

    // ValidTeachers (Same code)
    const validTeachers = processedTeachers.filter(t => t.teacherId && t.name && t.email);

    if (validTeachers.length === 0) {
      return res.status(400).json({ message: 'File has no valid teacher data. Check headers for teacherId, name, and email.' });
    }

    // NAYA: Har teacher data mein schoolId add karein
    const teachersWithSchoolId = validTeachers.map(teacher => ({
      ...teacher,
      schoolId: schoolId 
    }));

    // NAYA: Puraana 'Teacher.insertMany' isse badal gaya
    // Hum 'createMany' ka istemaal karenge, yeh bahut fast hai
    const result = await prisma.teachers.createMany({
      data: teachersWithSchoolId,
      skipDuplicates: true, // Yeh 'ordered: false' jaisa hai. Duplicate (email/teacherId) ko skip kar dega.
    });
    
    // 'result.count' batata hai ki kitne naye teachers *asli* mein add hue
    res.status(201).json({ message: `${result.count} teachers were added successfully!` });

  } catch (error) {
    console.error("Error during bulk teacher import:", error);
    // P2002 (Unique constraint) error ab nahi aana chahiye 'skipDuplicates: true' ke kaaran
    // Lekin agar koi aur error aata hai (jaise database connection)
    res.status(500).json({ message: 'Server error during import.' });
  }
};

// --- 5. FUNCTION 2: getAllTeachers (Prisma Version) ---
const getAllTeachers = async (req, res) => {
  try {
    // NAYA: School ID ko req.user se lein
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID.' });
    }

    // NAYA: Puraana 'Teacher.find()' isse badal gaya
    const teachers = await prisma.teachers.findMany({
      where: {
        schoolId: schoolId // Sirf iss school ke teachers ko find karein
      },
      orderBy: {
        name: 'asc' // Teachers ko naam se (A-Z) sort karein
      }
    });
    res.json(teachers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- 6. Exports ---
module.exports = {
  addTeachersInBulk,
  getAllTeachers,
};
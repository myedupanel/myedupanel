// File: backend/controllers/teacherController.js (SUPREME SECURE)

// --- 1. Imports ---
const prisma = require('../config/prisma'); 
// हमें user token से School ID चाहिए, इसलिए bcrypt, crypto, sendEmail की यहाँ ज़रूरत नहीं है

// === FIX 1: THE SANITIZER FUNCTION (XSS Prevention) ===
// यह फंक्शन किसी भी स्ट्रिंग से सभी HTML टैग्स को हटा देगा।
function removeHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  // रेगुलर एक्सप्रेशन का उपयोग करके HTML टैग्स को हटाएँ
  return str.replace(/<[^>]*>/g, '').trim(); 
}
// === END FIX 1 ===

// --- 2. Header Mappings ---
const headerMappings = {
  teacherId: ['teacherid', 'id', 'employee id', 'employeeid'],
  name: ['name', 'teacher name', 'teachername', 'full name'],
  subject: ['subject', 'subjects'],
  contactNumber: ['contactnumber', 'contact no', 'phone', 'mobile'],
  email: ['email', 'email id', 'emailaddress'],
};

// --- 3. Helper Function ---
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
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID.' });
    }

    const teachersData = req.body;
    if (!teachersData || !Array.isArray(teachersData)) {
      return res.status(400).json({ message: 'No data provided.' });
    }

    // ProcessedTeachers (अब Sanitization के साथ)
    const processedTeachers = teachersData.map(row => {
      const newTeacher = {};
      for (const rawHeader in row) {
        const canonicalKey = getCanonicalKey(rawHeader);
        if (canonicalKey) {
          const value = row[rawHeader];
          
          // === FIX 2: VALUE KO SANITIZE KAREIN ===
          newTeacher[canonicalKey] = removeHtmlTags(typeof value === 'string' ? value.trim() : value);
          // === END FIX 2 ===
        }
      }
      return newTeacher;
    });

    // ValidTeachers (Same code)
    const validTeachers = processedTeachers.filter(t => t.teacherId && t.name && t.email);

    if (validTeachers.length === 0) {
      return res.status(400).json({ message: 'File has no valid teacher data. Check headers for teacherId, name, and email.' });
    }

    // NAYA: Har teacher data mein schoolId aur academicYearId add karein
    const teachersWithSchoolId = validTeachers.map(teacher => ({
      ...teacher,
      schoolId: schoolId,
      academicYearId: req.academicYearId, // NAYA: Academic year ID ko add karein
      // email ko lowercase mein rakhein (best practice)
      email: teacher.email ? teacher.email.toLowerCase() : teacher.email 
    }));

    // createMany का इस्तेमाल करें
    const result = await prisma.teachers.createMany({
      data: teachersWithSchoolId,
      skipDuplicates: true, 
    });
    
    res.status(201).json({ message: `${result.count} teachers were added successfully!` });

  } catch (error) {
    console.error("Error during bulk teacher import:", error);
    res.status(500).json({ message: 'Server error during import.' });
  }
};

// --- 5. FUNCTION 2: getAllTeachers (Prisma Version) ---
const getAllTeachers = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID.' });
    }

    // NAYA: Academic year ID ke basis par filter karein
    const whereClause = {
      schoolId: schoolId,
      academicYearId: req.academicYearId
    };

    const teachers = await prisma.teachers.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc' 
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
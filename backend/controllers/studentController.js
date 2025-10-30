// File: backend/controllers/studentController.js

// 1. IMPORT (Prisma Client)
const prisma = require('../config/prisma');

// 2. HEADER MAPPINGS (Koi change nahi)
const headerMappings = {
  first_name: ['firstname', 'first name', 'student name', 'name'],
  father_name: ['fathername', 'father name', 'middle name', 'parentname', 'parent name'],
  last_name: ['lastname', 'last name', 'surname'],
  class_name: ['class', 'grade', 'standard', 'std', 'class number'],
  roll_number: ['rollno', 'roll no', 'roll number', 'rollnumber', 'roll'],
  guardian_contact: ['parentcontact', 'parent contact', 'contact', 'phone', 'mobile', 'contact number', 'mobile no'],
  mother_name: ['mothername', 'mother name'],
  dob: ['dob', 'date of birth'],
  address: ['address'],
  email: ['email', 'student email'],
  uid_number: ['uid', 'uid number', 'aadhar', 'aadhar card'],
  nationality: ['nationality'],
  caste: ['caste'],
  birth_place: ['birthplace', 'birth place'],
  admission_date: ['admission date', 'admissiondate'],
};

// 3. HELPER FUNCTION (Koi change nahi)
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

// 4. FUNCTION 1: addStudentsInBulk (schoolId ke saath)
const addStudentsInBulk = async (req, res) => {
  try {
    // --- NAYA STEP: School ID ko request se lein ---
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID in user token.' });
    }

    const studentsData = req.body;
    if (!studentsData || !Array.isArray(studentsData)) {
      return res.status(400).json({ message: 'No student data provided.' });
    }

    // 1. Rows ko process karein (Same)
    const processedStudents = studentsData.map(row => {
      // ... (andar ka code same hai) ...
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
    
    // 2. Filter karein (Same)
    const validStudents = processedStudents.filter(
      s => s.first_name && s.last_name && s.class_name && s.roll_number
    );
    
    if (validStudents.length === 0) {
      // ... (andar ka code same hai) ...
      return res.status(400).json({ message: 'No valid student data. Ensure file has first_name, last_name, class_name, roll_number.' });
    }

    let createdCount = 0;
    const errors = [];

    // 3. Ek-ek karke student create karein
    for (const student of validStudents) {
      try {
        const className = student.class_name;
        
        // 4. --- UPDATE: Class ko schoolId ke saath Find karein ---
        // Humne schema mein @@unique([schoolId, class_name]) set kiya tha
        // Isliye humein Prisma ko is tarah batana hoga:
        let classRecord = await prisma.classes.findUnique({
          where: { 
            schoolId_class_name: { // Yeh Prisma ne automatically banaya hai
              schoolId: schoolId,
              class_name: className 
            }
          },
        });

        // Agar class nahi mili, toh nayi class banayein
        if (!classRecord) {
          classRecord = await prisma.classes.create({
            data: { 
              class_name: className,
              schoolId: schoolId // --- UPDATE: schoolId yahaan bhi add karein ---
            },
          });
        }
        
        // 5. Student data ko Prisma ke liye taiyaar karein
        const { class_name, ...studentData } = student; 
        studentData.classid = classRecord.classid; 
        studentData.schoolId = schoolId; // --- UPDATE: schoolId student mein add karein ---

        // Date fields ko handle karein (Same)
        if (studentData.dob) {
          // ... (andar ka code same hai) ...
           try {
            const parsedDate = new Date(studentData.dob);
            if (!isNaN(parsedDate)) {
                studentData.dob = parsedDate;
            } else {
                studentData.dob = null; 
            }
          } catch (e) {
            studentData.dob = null;
          }
        }
        if (studentData.admission_date) {
          // ... (andar ka code same hai) ...
           try {
             const parsedDate = new Date(studentData.admission_date);
             if (!isNaN(parsedDate)) {
                studentData.admission_date = parsedDate;
             } else {
                studentData.admission_date = null; 
             }
           } catch (e) {
             studentData.admission_date = null;
           }
        }

        // 6. Student ko create karein (Same)
        await prisma.students.create({
          data: studentData,
        });
        createdCount++;

      } catch (error) {
        // ... (error handling code same hai) ...
         console.error("Error creating individual student:", error);
        if (error.code === 'P2002') { 
           errors.push(`Duplicate entry for student: ${student.first_name || 'N/A'} (Roll No: ${student.roll_number || 'N/A'})`);
        } else {
           errors.push(`Error for student ${student.first_name || 'N/A'}: ${error.message}`);
        }
      }
    }

    // 7. Final response (Same)
    res.status(201).json({
      message: `${createdCount} of ${validStudents.length} students were added successfully.`,
      errors: errors,
      totalProcessed: validStudents.length,
    });

  } catch (error) {
    console.error("---!!!--- CRITICAL ERROR DURING BULK IMPORT ---!!!---");
    console.error(error);
    res.status(500).json({ message: 'Server error while importing students.' });
  }
};

// 5. FUNCTION 2: getAllStudents (schoolId ke saath)
const getAllStudents = async (req, res) => {
  try {
    // --- NAYA STEP: School ID ko request se lein ---
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID in user token.' });
    }

    const students = await prisma.students.findMany({
      // --- UPDATE: Sirf uss school ke students ko filter karein ---
      where: {
        schoolId: schoolId
      },
      include: {
        class: true, // Class ka naam bhi saath mein fetch karega
      },
      orderBy: [
        { class: { class_name: 'asc' } }, // Pehle class ke naam se sort
        { first_name: 'asc' },           // Phir student ke naam se
      ],
    });
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 6. EXPORTS
module.exports = {
  addStudentsInBulk,
  getAllStudents,
};
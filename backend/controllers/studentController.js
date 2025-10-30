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

// 4. FUNCTION 1: addStudentsInBulk (Koi change nahi)
const addStudentsInBulk = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID in user token.' });
    }

    const studentsData = req.body;
    if (!studentsData || !Array.isArray(studentsData)) {
      return res.status(400).json({ message: 'No student data provided. Expected an array for bulk import.' });
    }

    // 1. Rows ko process karein
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
    
    // 2. Filter karein
    const validStudents = processedStudents.filter(
      s => s.first_name && s.last_name && s.class_name && s.roll_number
    );
    
    if (validStudents.length === 0) {
      return res.status(400).json({ message: 'No valid student data. Ensure file has first_name, last_name, class_name, roll_number.' });
    }

    let createdCount = 0;
    const errors = [];

    // 3. Ek-ek karke student create karein
    for (const student of validStudents) {
      try {
        const className = student.class_name;
        
        // 4. Class ko schoolId ke saath Find karein
        let classRecord = await prisma.classes.findUnique({
          where: { 
            schoolId_class_name: { 
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
              schoolId: schoolId 
            },
          });
        }
        
        // 5. Student data ko Prisma ke liye taiyaar karein
        const { class_name, ...studentData } = student; 
        studentData.classid = classRecord.classid; 
        studentData.schoolId = schoolId; 

        // Date fields ko handle karein
        if (studentData.dob) {
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

        // 6. Student ko create karein
        await prisma.students.create({
          data: studentData,
        });
        createdCount++;

      } catch (error) {
         console.error("Error creating individual student:", error);
        if (error.code === 'P2002') { 
           errors.push(`Duplicate entry for student: ${student.first_name || 'N/A'} (Roll No: ${student.roll_number || 'N/A'})`);
        } else {
           errors.push(`Error for student ${student.first_name || 'N/A'}: ${error.message}`);
        }
      }
    }

    // 7. Final response
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

// 5. FUNCTION 2: getAllStudents (Koi change nahi)
const getAllStudents = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID in user token.' });
    }

    const students = await prisma.students.findMany({
      where: {
        schoolId: schoolId
      },
      include: {
        class: true, 
      },
      orderBy: [
        { class: { class_name: 'asc' } }, 
        { first_name: 'asc' },           
      ],
    });
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// 6. FUNCTION 3: addSingleStudent (UPDATED)
const addSingleStudent = async (req, res) => {
  try {
    // 1. School ID token se lein
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(401).json({ message: 'User not authorized or missing school ID.' });
    }

    // 2. Data ko req.body se lein
    // --- YEH HAI AAPKA FIX (Line 214) ---
    const { 
      first_name, 
      last_name, 
      class_name, 
      roll_number, 
      parentName, // <-- Frontend se 'parentName' ko alag se nikaala
      ...otherDetails 
    } = req.body;
    // --- FIX ENDS HERE ---


    // 3. Zaroori fields check karein
    if (!first_name || !last_name || !class_name || !roll_number) {
      return res.status(400).json({ message: 'Missing required fields: First Name, Last Name, Class, and Roll Number are required.' });
    }
    
    // 4. Class ko find karein ya create karein
    let classRecord = await prisma.classes.findUnique({
      where: { 
        schoolId_class_name: {
          schoolId: schoolId,
          class_name: class_name 
        }
      },
    });

    if (!classRecord) {
      classRecord = await prisma.classes.create({
        data: { 
          class_name: class_name,
          schoolId: schoolId 
        },
      });
    }

    // 5. Student data ko Prisma ke liye taiyaar karein
    // --- YEH HAI AAPKA FIX (Line 252) ---
    const studentData = {
      ...otherDetails, 
      first_name,
      last_name,
      roll_number,
      father_name: parentName, // <-- 'parentName' ko 'father_name' se map kiya
      classid: classRecord.classid,
      schoolId: schoolId,
    };
    // --- FIX ENDS HERE ---

    // 6. Date fields ko handle karein
    if (studentData.dob) {
      try {
        const parsedDate = new Date(studentData.dob);
        studentData.dob = !isNaN(parsedDate) ? parsedDate : null;
      } catch (e) { studentData.dob = null; }
    }
    if (studentData.admission_date) {
       try {
         const parsedDate = new Date(studentData.admission_date);
         studentData.admission_date = !isNaN(parsedDate) ? parsedDate : null;
       } catch (e) { studentData.admission_date = null; }
    }

    // 7. Naya student create karein
    const newStudent = await prisma.students.create({
      data: studentData,
    });

    // 8. Success response bhejein
    res.status(201).json({ message: 'Student added successfully!', student: newStudent });

  } catch (error) {
    console.error("Error creating single student:", error);
    if (error.code === 'P2002') { // Duplicate entry error
       return res.status(400).json({ message: `Duplicate entry: A student with Roll Number ${req.body.roll_number} may already exist in ${req.body.class_name}.` });
    }
    // Agar koi aur validation error aaye (jaise koi aur field missing ho)
    if (error.code === 'P2012' || error.name === 'PrismaClientValidationError') {
        return res.status(400).json({ message: 'Data validation error. Please check all fields.', details: error.message });
    }
    res.status(500).json({ message: 'Server error while adding student.' });
  }
};


// 7. EXPORTS (Koi change nahi)
module.exports = {
  addStudentsInBulk,
  getAllStudents,
  addSingleStudent, 
};
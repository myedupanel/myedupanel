// File: backend/controllers/studentController.js

// 1. IMPORTS (Prisma Client aur naye modules)
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs'); // <-- FIX: Password hash ke liye add kiya
const crypto = require('crypto'); // <-- FIX: Random password ke liye add kiya
const sendEmail = require('../utils/sendEmail'); // <-- FIX: Email bhejne ke liye add kiya

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

// 4. FUNCTION 1: addStudentsInBulk (UPDATED)
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

    // 1. Rows ko process karein (No Change)
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
    
    // 2. Filter karein (No Change)
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
        
        // 4. Class ko schoolId ke saath Find karein (No Change)
        let classRecord = await prisma.classes.findUnique({
          where: { 
            schoolId_class_name: { 
              schoolId: schoolId,
              class_name: className 
            }
          },
        });

        // Agar class nahi mili, toh nayi class banayein (No Change)
        if (!classRecord) {
          classRecord = await prisma.classes.create({
            data: { 
              class_name: className,
              schoolId: schoolId 
            },
          });
        }
        
        // 5. Student data ko Prisma ke liye taiyaar karein (No Change)
        const { class_name, ...studentData } = student; 
        studentData.classid = classRecord.classid; 
        studentData.schoolId = schoolId; 

        // Date fields ko handle karein (No Change)
        if (studentData.dob) {
           try {
            const parsedDate = new Date(studentData.dob);
            if (!isNaN(parsedDate)) { studentData.dob = parsedDate; } else { studentData.dob = null; }
          } catch (e) { studentData.dob = null; }
        }
        if (studentData.admission_date) {
           try {
             const parsedDate = new Date(studentData.admission_date);
             if (!isNaN(parsedDate)) { studentData.admission_date = parsedDate; } else { studentData.admission_date = null; }
           } catch (e) { studentData.admission_date = null; }
        }

        // --- 6. FIX: Student aur User ko ek saath Transaction mein create karein ---
        const studentFullName = `${studentData.first_name} ${studentData.last_name}`;
        const studentEmail = studentData.email ? studentData.email.toLowerCase() : null;

        await prisma.$transaction(async (tx) => {
          // Kadam 6a: Student create karein
          await tx.students.create({
            data: studentData,
          });

          // Kadam 6b: Agar email hai, toh User (login) bhi create karein
          if (studentEmail) {
            const tempPassword = crypto.randomBytes(8).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);
            
            await tx.user.create({
              data: {
                schoolId: schoolId,
                name: studentFullName,
                email: studentEmail, 
                password: hashedPassword,
                role: 'student',
                isVerified: true, // Admin bana raha hai, isliye verified
              }
            });
            // Note: Bulk import se welcome email nahi bhej rahe hain (performance)
          }
        });
        // --- END FIX ---
        
        createdCount++;

      } catch (error) {
         console.error("Error creating individual student:", error);
        if (error.code === 'P2002') { 
           // Ab yeh error duplicate roll_number ya duplicate email, dono pakad lega
           const target = error.meta?.target || [];
           if (target.includes('email')) {
               errors.push(`Duplicate email for student: ${student.first_name || 'N/A'} (Email: ${student.email})`);
           } else {
               errors.push(`Duplicate entry for student: ${student.first_name || 'N/A'} (Roll No: ${student.roll_number || 'N/A'})`);
           }
        } else {
           errors.push(`Error for student ${student.first_name || 'N/A'}: ${error.message}`);
        }
      }
    }

    // 7. Final response (No Change)
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
    // 1. School ID token se lein (No Change)
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(401).json({ message: 'User not authorized or missing school ID.' });
    }

    // 2. Data ko req.body se lein (No Change)
    const { 
      first_name, 
      last_name, 
      class_name, 
      roll_number,
      father_name,
      guardian_contact,
      ...otherDetails // 'email' ab 'otherDetails' mein aayega
    } = req.body;

    // 3. Zaroori fields check karein (No Change)
    if (!first_name || !last_name || !class_name || !roll_number || !father_name || !guardian_contact) {
      return res.status(400).json({ message: 'Missing required fields: First Name, Last Name, Class, Roll Number, Parent Name, and Parent Contact are required.' });
    }
    
    // 4. Class ko find karein ya create karein (No Change)
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

    // 5. Student data ko Prisma ke liye taiyaar karein (No Change)
    const studentData = {
      ...otherDetails, 
      first_name,
      last_name,
      roll_number,
      father_name,
      guardian_contact,
      classid: classRecord.classid,
      schoolId: schoolId,
    };

    // 6. Date fields ko handle karein (No Change)
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

    // --- 7. FIX: Naya student aur user transaction mein create karein ---
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    const studentFullName = `${first_name} ${last_name}`;
    // 'email' ko otherDetails se lein (agar hai)
    const studentEmail = studentData.email ? studentData.email.toLowerCase() : null; 

    const newStudent = await prisma.$transaction(async (tx) => {
      
      // Kadam 7a: Naya student create karein
      const createdStudent = await tx.students.create({
        data: studentData,
      });

      // Kadam 7b: Agar email diya hai, toh User entry (login) bhi create karein
      if (studentEmail) {
        await tx.user.create({
          data: {
            schoolId: schoolId,
            name: studentFullName,
            email: studentEmail,
            password: hashedPassword,
            role: 'student',
            isVerified: true, // Admin create kar raha hai, isliye verified
          }
        });
      }
      
      return createdStudent; // Transaction se student return karein
    });
    // --- END FIX ---


    // --- 8. FIX: Welcome email bhejein (agar email tha) ---
    if (studentEmail) {
      try {
        const schoolName = req.user.schoolName || 'MyEduPanel'; // Token se school ka naam lein
        const message = `<h1>Welcome to ${schoolName}!</h1><p>An account has been created for your child, ${studentFullName}.</p><p>You can use these details to log in to the student/parent portal.</p><p><strong>Email:</strong> ${studentEmail}</p><p><strong>Temporary Password:</strong> ${tempPassword}</p><p>Please log in and change your password at your earliest convenience.</p>`;
        await sendEmail({ to: studentEmail, subject: `Your Account for ${schoolName}`, html: message });
      } catch (emailError) {
        console.error("Student added, but failed to send welcome email:", emailError);
        // Request ko fail na karein, bas error log karein
      }
    }
    // --- END FIX ---


    // 9. Success response bhejein
    res.status(201).json({ message: 'Student added successfully!', student: newStudent });

  } catch (error) {
    console.error("Error creating single student:", error);
    
    // --- 10. FIX: Catch block ko update karein taaki User email errors bhi pakde ---
    if (error.code === 'P2002') { // Duplicate entry error
       const target = error.meta?.target || [];
       if (target.includes('email')) {
           return res.status(400).json({ message: `An account with this email (${req.body.email}) already exists in the User table.` });
       }
       if (target.includes('roll_number')) {
           return res.status(400).json({ message: `Duplicate entry: A student with Roll Number ${req.body.roll_number} may already exist in ${req.body.class_name}.` });
       }
       return res.status(400).json({ message: `Duplicate entry error on: ${target.join(', ')}` });
    }
    // --- END FIX ---

    if (error.code === 'P2012' || error.name === 'PrismaClientValidationError') {
        const match = error.message.match(/Argument `(.*)` is missing/);
        const missingField = match ? match[1] : 'a required field';
        console.error(`Validation Error: Missing field: ${missingField}`);
        return res.status(400).json({ message: `Data validation error. Please check all fields. Missing: ${missingField}` });
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
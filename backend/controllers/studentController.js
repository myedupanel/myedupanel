// File: backend/controllers/studentController.js

// 1. IMPORTS (No Change)
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto'); 
const sendEmail = require('../utils/sendEmail'); 

// === YAHAN FIX KIYA (1/4): Smart mapping ko "SELF-AWARE" banaya ===
// Humne 'clean keys' (jaise 'first_name') aur normalized keys (jaise 'firstname') add kar di hain
const headerMappings = {
  first_name: ['firstname', 'first name', 'student name', 'name', 'first_name'],
  father_name: ['fathername', 'father name', 'middle name', 'parentname', 'parent name', 'father_name'],
  last_name: ['lastname', 'last name', 'surname', 'last_name'],
  class_name: ['class', 'grade', 'standard', 'std', 'class number', 'class_name', 'classname'], // 'classname' add kiya
  roll_number: ['rollno', 'roll no', 'roll number', 'rollnumber', 'roll', 'roll_number'],
  guardian_contact: ['parentcontact', 'parent contact', 'contact', 'phone', 'mobile', 'contact number', 'mobile no', 'guardian_contact', 'guardiancontact'], // 'guardiancontact' add kiya
  // Optional fields
  mother_name: ['mothername', 'mother name', 'mother_name'],
  dob: ['dob', 'date of birth', 'birth date'],
  address: ['address'],
  email: ['email', 'student email'],
  uid_number: ['uid', 'uid number', 'aadhar', 'aadhar card', 'uid_number', 'uidnumber'],
  nationality: ['nationality'],
  caste: ['caste'],
  birth_place: ['birthplace', 'birth place', 'birth_place'],
  admission_date: ['admission date', 'admissiondate', 'admission_date'],
};

// 3. HELPER FUNCTION (No Change)
function getCanonicalKey(header) {
  if (!header) return null;
  // Bug fix: _ (underscore) ko bhi replace karein
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
    
    // DEBUG LOGS (Inhe rehne dein, problem solve hone ke baad hata denge)
    console.log("--- DEBUG: RAW DATA RECEIVED FROM FRONTEND ---");
    console.log(JSON.stringify(studentsData, null, 2));
    
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

    // DEBUG LOG 2
    console.log("--- DEBUG: DATA AFTER BACKEND MAPPING (processedStudents) ---");
    console.log(JSON.stringify(processedStudents, null, 2));
    
    // === YAHAN FIX KIYA (2/4): Strict filter ko HATA diya ===
    // (Pehle se hata hua hai)

    let createdCount = 0;
    const errors = [];

    // === YAHAN FIX KIYA (3/4): 'validStudents' ki jagah 'processedStudents' par loop ===
    // 3. Ek-ek karke student create karein
    for (const student of processedStudents) {
      try {
        // === YAHAN FIX KIYA (4/4): Naya flexible check, loop ke andar ===
        // Zaroori fields ko check karein
        const { first_name, last_name, class_name, roll_number, father_name, guardian_contact } = student;
        if (!first_name || !last_name || !class_name || !roll_number || !father_name || !guardian_contact) {
          errors.push(`Skipped row: Missing required data for student '${first_name || 'N/A'}' (Roll No: ${roll_number || 'N/A'}). Required: first_name, last_name, class_name, roll_number, father_name, guardian_contact.`);
          
          // DEBUG LOG 3
          if (processedStudents.indexOf(student) === 0) { // Sirf pehle student ka error dikhao
            console.log("--- DEBUG: FIRST STUDENT REJECTED ---");
            console.log("REASON: Missing one or more required fields.");
            console.log("DATA RECEIVED:", student);
          }
          continue; // Is student ko skip karo aur agle par jaao
        }
        // === FLEXIBLE CHECK ENDS ===

        const className = student.class_name;
        
        // 4. Class ko find/create karein (No Change)
        let classRecord = await prisma.classes.findUnique({
          where: { schoolId_class_name: { schoolId: schoolId, class_name: className } },
        });
        if (!classRecord) {
          classRecord = await prisma.classes.create({
            data: { class_name: className, schoolId: schoolId },
          });
        }
        
        // 5. Student data ko Prisma ke liye taiyaar karein (No Change)
        const { class_name: cn, ...studentData } = student; // class_name ko hataya
        studentData.classid = classRecord.classid; 
        studentData.schoolId = schoolId; 

        // --- 6. FIX: Date fields ko handle karein ---
        // (Pehle se theek hai)
        if (studentData.dob) {
           try {
            if (typeof studentData.dob === 'number') {
                const parsedDate = new Date(Date.UTC(1899, 11, 30 + studentData.dob));
                if (!isNaN(parsedDate)) { studentData.dob = parsedDate; } else { studentData.dob = null; }
            } else {
                const parsedDate = new Date(studentData.dob);
                if (!isNaN(parsedDate)) { studentData.dob = parsedDate; } else { studentData.dob = null; }
            }
          } catch (e) { studentData.dob = null; }
        }
        if (studentData.admission_date) {
           try {
             if (typeof studentData.admission_date === 'number') {
                const parsedDate = new Date(Date.UTC(1899, 11, 30 + studentData.admission_date));
                studentData.admission_date = !isNaN(parsedDate) ? parsedDate : new Date();
             } else {
                const parsedDate = new Date(studentData.admission_date);
                studentData.admission_date = !isNaN(parsedDate) ? parsedDate : new Date(); 
             }
           } catch (e) { 
             studentData.admission_date = new Date(); 
           }
        } else {
           studentData.admission_date = new Date(); 
        }
        // --- END FIX ---

        // 7. Student aur User Transaction (No Change)
        const studentFullName = `${studentData.first_name} ${studentData.last_name}`;
        const realEmail = studentData.email ? studentData.email.toLowerCase() : null;
        const safeRollNumber = studentData.roll_number.replace(/[\s\W]+/g, '');
        const dummyEmail = `${safeRollNumber}@${schoolId}.local`;
        const emailForUserTable = realEmail || dummyEmail;

        await prisma.$transaction(async (tx) => {
          // 7a: Student create karein
          await tx.students.create({
            data: studentData, // Ismein ab admission_date hamesha hogi
          });

          // 7b: Hamesha User (login) create karein
          const tempPassword = crypto.randomBytes(8).toString('hex');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(tempPassword, salt);
          
          await tx.user.create({
            data: {
              schoolId: schoolId,
              name: studentFullName,
              email: emailForUserTable,
              password: hashedPassword,
              role: 'student',
              isVerified: true,
            }
          });
        });
        
        createdCount++;

      } catch (error) {
         // ... (existing error handling)
         console.error("Error creating individual student:", error);
        if (error.code === 'P2002') { 
           const target = error.meta?.target || [];
           if (target.includes('email')) {
               errors.push(`Duplicate email for student: ${student.first_name || 'N/A'} (Email: ${student.email || 'dummy'})`);
           } else {
               errors.push(`Duplicate entry for student: ${student.first_name || 'N/A'} (Roll No: ${student.roll_number || 'N/A'})`);
           }
        } else {
           errors.push(`Error for student ${student.first_name || 'N/A'}: ${error.message}`);
        }
      }
    } // End of for...of loop

    // 8. Final response (No Change)
    res.status(201).json({
      message: `${createdCount} of ${processedStudents.length} students were added successfully.`,
      errors: errors,
      totalProcessed: processedStudents.length,
    });

  } catch (error) {
    console.error("---!!!--- CRITICAL ERROR DURING BULK IMPORT ---!!!---");
    console.error(error);
    res.status(500).json({ message: 'Server error while importing students.' });
  }
};

// ... (Baaki poori file 'getAllStudents' aur 'addSingleStudent' waise hi rahegi) ...

// 5. FUNCTION 2: getAllStudents (No Change)
const getAllStudents = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID in user token.' });
    }
    const students = await prisma.students.findMany({
      where: { schoolId: schoolId },
      include: { class: true },
      orderBy: [ { class: { class_name: 'asc' } }, { first_name: 'asc' } ],
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
    // 1. School ID (No Change)
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
      ...otherDetails
    } = req.body;

    // 3. Zaroori fields check karein (No Change)
    if (!first_name || !last_name || !class_name || !roll_number || !father_name || !guardian_contact) {
      return res.status(400).json({ message: 'Missing required fields: First Name, Last Name, Class, Roll Number, Parent Name, and Parent Contact are required.' });
    }
    
    // 4. Class ko find/create karein (No Change)
    let classRecord = await prisma.classes.findUnique({
      where: { schoolId_class_name: { schoolId: schoolId, class_name: class_name } },
    });
    if (!classRecord) {
      classRecord = await prisma.classes.create({
        data: { class_name: class_name, schoolId: schoolId },
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

    // --- 6. FIX: Date fields ko handle karein ---
    // DOB (optional reh sakta hai, null theek hai)
    if (studentData.dob) {
      try {
        const parsedDate = new Date(studentData.dob);
        studentData.dob = !isNaN(parsedDate) ? parsedDate : null;
      } catch (e) { studentData.dob = null; }
    }
    
    // Admission Date (DEFAULT TO TODAY agar missing ya invalid hai)
    if (studentData.admission_date) {
       try {
         const parsedDate = new Date(studentData.admission_date);
         // Agar date invalid hai, toh aaj ki date set karein
         studentData.admission_date = !isNaN(parsedDate) ? parsedDate : new Date();
       } catch (e) { 
         studentData.admission_date = new Date(); // Error par aaj ki date
       }
    } else {
       studentData.admission_date = new Date(); // Agar field tha hi nahi, toh aaj ki date
    }
    // --- END FIX ---


    // 7. Transaction (No Change)
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    const studentFullName = `${first_name} ${last_name}`;
    const realEmail = studentData.email ? studentData.email.toLowerCase() : null;
    const safeRollNumber = roll_number.replace(/[\s\W]+/g, '');
    const dummyEmail = `${safeRollNumber}@${schoolId}.local`;
    const emailForUserTable = realEmail || dummyEmail;

    const newStudent = await prisma.$transaction(async (tx) => {
      // 7a: Naya student create karein
      const createdStudent = await tx.students.create({
        data: studentData, // Ismein ab admission_date hamesha hogi
      });

      // 7b: Hamesha User entry (login) create karein
      await tx.user.create({
        data: {
          schoolId: schoolId,
          name: studentFullName,
          email: emailForUserTable,
          password: hashedPassword,
          role: 'student',
          isVerified: true,
        }
      });
      
      return createdStudent;
    });

    // 8. Welcome email (sirf REAL email par) bhejein (No Change)
    if (realEmail) { 
      try {
        const schoolName = req.user.schoolName || 'MyEduPanel';
        const message = `<h1>Welcome to ${schoolName}!</h1><p>An account has been created for your child, ${studentFullName}.</p><p>You can use these details to log in to the student/parent portal.</p><p><strong>Email:</strong> ${realEmail}</p><p><strong>Temporary Password:</strong> ${tempPassword}</p><p>Please log in and change your password at your earliest convenience.</p>`;
        await sendEmail({ to: realEmail, subject: `Your Account for ${schoolName}`, html: message });
      } catch (emailError) {
        console.error("Student added, but failed to send welcome email:", emailError);
      }
    }

    // 9. Success response (No Change)
    res.status(201).json({ message: 'Student added successfully!', student: newStudent });

  } catch (error) {
    // 10. Catch block (No Change)
    console.error("Error creating single student:", error);
    if (error.code === 'P2002') { 
       const target = error.meta?.target || [];
       if (target.includes('email')) {
           return res.status(400).json({ message: `An account with this email (${req.body.email || 'dummy email'}) already exists in the User table.` });
       }
       if (target.includes('roll_number')) {
           return res.status(400).json({ message: `Duplicate entry: A student with Roll Number ${req.body.roll_number} may already exist in ${req.body.class_name}.` });
       }
       return res.status(400).json({ message: `Duplicate entry error on: ${target.join(', ')}` });
    }
    if (error.code === 'P2012' || error.name === 'PrismaClientValidationError') {
        const match = error.message.match(/Argument `(.*)` is missing/);
        const missingField = match ? match[1] : 'a required field';
        console.error(`Validation Error: Missing field: ${missingField}`);
        return res.status(400).json({ message: `Data validation error. Please check all fields. Missing: ${missingField}` });
    }
    res.status(500).json({ message: 'Server error while adding student.' });
  }
};


// 7. EXPORTS (No Change)
module.exports = {
  addStudentsInBulk,
  getAllStudents,
  addSingleStudent, 
};
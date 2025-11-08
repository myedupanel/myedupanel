// File: backend/controllers/studentController.js (SUPREME SECURE & SUPERFAST)

// 1. IMPORTS
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto'); 
const sendEmail = require('../utils/sendEmail'); 
const { Prisma } = require('@prisma/client');

// === FIX 1: THE SANITIZER FUNCTION (XSS Prevention) ===
function removeHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '').trim(); 
}
// === END FIX 1 ===

// 2. MAPPING (No Change)
const headerMappings = {
  first_name: ['firstname', 'first name', 'student name', 'name', 'first_name'],
  father_name: ['fathername', 'father name', 'middle name', 'parentname', 'parent name', 'father_name'],
  last_name: ['lastname', 'last name', 'surname', 'last_name'],
  class_name: ['class', 'grade', 'standard', 'std', 'class number', 'class_name', 'classname'], 
  roll_number: ['rollno', 'roll no', 'roll number', 'rollnumber', 'roll', 'roll_number','Roll Number'], 
  guardian_contact: ['parentcontact', 'parent contact', 'contact', 'phone', 'mobile', 'contact number', 'mobile no', 'guardian_contact', 'guardiancontact'],
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
  const normalizedHeader = header.toLowerCase().replace(/[\s_-]/g, '');
  for (const key in headerMappings) {
    if (headerMappings[key].includes(normalizedHeader)) {
      return key;
    }
  }
  return null;
}

// 4. FUNCTION 1: addStudentsInBulk (SUPERFAST BATCH PROCESSING)
const addStudentsInBulk = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'Invalid or missing school ID in user token.' });
    }

    const studentsData = req.body;
    if (!studentsData || !Array.isArray(studentsData) || studentsData.length === 0) {
      return res.status(400).json({ message: 'No student data provided.' });
    }

    // 1. Raw Data Processing और Sanitization
    const processedStudents = studentsData.map(row => {
      const newStudent = {};
      for (const rawHeader in row) {
        const canonicalKey = getCanonicalKey(rawHeader);
        if (canonicalKey) {
          const value = row[rawHeader];
          // Value ko sanitize karte hain (FIX 2: XSS Safety)
          newStudent[canonicalKey] = removeHtmlTags(typeof value === 'string' ? value.trim() : value);
        }
      }
      return newStudent;
    }).filter(s => s.first_name && s.last_name && s.class_name && s.roll_number); // Required fields check

    if (processedStudents.length === 0) {
         return res.status(400).json({ message: 'No valid student data found with required fields.' });
    }

    // 2. BATCH 1: Classes ko Pre-Process aur Create karein
    const uniqueClassNames = Array.from(new Set(processedStudents.map(s => s.class_name)));
    
    const existingClasses = await prisma.classes.findMany({
        where: { schoolId, class_name: { in: uniqueClassNames } },
        select: { class_name: true, classid: true }
    });

    const existingClassNames = new Set(existingClasses.map(c => c.class_name));
    const missingClassNames = uniqueClassNames.filter(name => !existingClassNames.has(name));

    // Nayi classes ko createMany se banao
    if (missingClassNames.length > 0) {
        const classesToCreate = missingClassNames.map(name => ({
            class_name: name,
            schoolId: schoolId
        }));
        await prisma.classes.createMany({ data: classesToCreate });
    }
    
    // Nayi aur puraani saari classes ki ID fetch karein
    const allClasses = await prisma.classes.findMany({
        where: { schoolId, class_name: { in: uniqueClassNames } },
        select: { class_name: true, classid: true }
    });

    const classMap = new Map(allClasses.map(c => [c.class_name, c.classid]));


    // 3. BATCH 2 & 3: Student aur User Data Arrays ko taiyaar karein
    const studentsToCreate = [];
    const usersToCreate = [];

    const salt = await bcrypt.genSalt(10); // Hash ke liye salt ek baar generate karein

    for (const student of processedStudents) {
        const classid = classMap.get(student.class_name);
        if (!classid) continue;

        // Date Handling (Excel number-based date ko handle karein)
        const dateFields = ['dob', 'admission_date'];
        for (const field of dateFields) {
            if (student[field]) {
                try {
                    if (typeof student[field] === 'number') {
                        const parsedDate = new Date(Date.UTC(1899, 11, 30 + student[field]));
                        student[field] = !isNaN(parsedDate.getTime()) ? parsedDate : null;
                    } else {
                        const parsedDate = new Date(student[field]);
                        student[field] = !isNaN(parsedDate.getTime()) ? parsedDate : null;
                    }
                } catch (e) { student[field] = null; }
            } else if (field === 'admission_date') {
                 student[field] = new Date(); 
            }
        }

        // Student data for createMany
        const studentData = {
            ...student, 
            roll_number: String(student.roll_number || ''),
            classid: classid,
            schoolId: schoolId,
            class_name: undefined, 
        };
        studentsToCreate.push(studentData);


        // User data for createMany 
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, salt);
        const studentFullName = `${student.first_name} ${student.last_name}`;
        const realEmail = student.email ? student.email.toLowerCase() : null;
        const safeRollNumber = String(student.roll_number || '').replace(/[\s\W]+/g, '');
        const dummyEmail = `${safeRollNumber}@${schoolId.substring(0, 8)}.local`; 
        const emailForUserTable = realEmail || dummyEmail;

        usersToCreate.push({
            schoolId: schoolId,
            name: studentFullName,
            email: emailForUserTable,
            password: hashedPassword,
            role: 'student',
            isVerified: true,
        });
    }

    // 4. BATCH EXECUTION: Student aur User ko createMany se banao
    
    // BATCH 1: STUDENTS CREATE KAREIN
    const studentResult = await prisma.students.createMany({ 
        data: studentsToCreate,
        skipDuplicates: true 
    });

    // BATCH 2: USERS CREATE KAREIN (Email Unique hona chahiye)
    const userResult = await prisma.user.createMany({ 
        data: usersToCreate,
        skipDuplicates: true
    });
    
    const createdCount = studentResult.count;
    
    // 5. Final Response
    res.status(201).json({
      message: `${createdCount} students were added successfully! (Superfast Mode)`,
      studentsCreated: createdCount,
      usersCreated: userResult.count,
      totalProcessed: studentsData.length,
    });

  } catch (error) {
    console.error("---!!!--- CRITICAL ERROR DURING BULK IMPORT (SUPERFAST) ---!!!---");
    console.error(error);
    res.status(500).json({ message: 'Server error while importing students. Check logs for details.' });
  }
};

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


// 6. FUNCTION 3: addSingleStudent (UPDATED: Sanitization Applied)
const addSingleStudent = async (req, res) => {
  try {
    // 1. School ID (No Change)
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(401).json({ message: 'User not authorized or missing school ID.' });
    }

    // 2. Data ko req.body se lein (Sanitization Applied)
    const sanitizedBody = {};
    for (const key in req.body) {
        sanitizedBody[key] = removeHtmlTags(req.body[key]);
    }
    
    const { 
      first_name, 
      last_name, 
      class_name, 
      roll_number,
      father_name,
      guardian_contact,
      ...otherDetails
    } = sanitizedBody;

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
         studentData.admission_date = !isNaN(parsedDate) ? parsedDate : new Date();
       } catch (e) { 
         studentData.admission_date = new Date(); 
       }
    } else {
       studentData.admission_date = new Date(); 
    }

    // 7. Transaction (No Change)
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    const studentFullName = `${first_name} ${last_name}`;
    const realEmail = studentData.email ? studentData.email.toLowerCase() : null;
    
    // Yahan bhi string conversion add kar raha hoon (Safety ke liye)
    const rollNumberStr = String(roll_number || '');
    const safeRollNumber = rollNumberStr.replace(/[\s\W]+/g, '');

    const dummyEmail = `${safeRollNumber}@${schoolId}.local`;
    const emailForUserTable = realEmail || dummyEmail;

    const newStudent = await prisma.$transaction(async (tx) => {
      // 7a: Naya student create karein
      const createdStudent = await tx.students.create({
        data: studentData, 
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
    // 10. Catch block (Errors ko handle karein)
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
    // Prisma Validation Error: Missing field
    if (error instanceof Prisma.PrismaClientValidationError) {
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
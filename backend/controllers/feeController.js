// File: backend/controllers/feeController.js (SUPREME SECURE)

// 1. IMPORTS
const prisma = require('../config/prisma'); // Sirf Prisma client
const xlsx = require('xlsx');
const Razorpay = require('razorpay');
const crypto = require('crypto'); // Webhook ke liye zaroori

// === FIX 1: THE SANITIZER FUNCTION (XSS Prevention) ===
// यह फंक्शन किसी भी स्ट्रिंग से सभी HTML टैग्स को हटा देगा।
function removeHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '').trim(); 
}
// === END FIX 1 ===

// Razorpay initialization (No Change)
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
} else {
    console.warn("RAZORPAY KEYS NOT SET. Online payments will fail. Server will start.");
}


// Helper function student ka poora naam jodne ke liye
const getFullName = (student) => {
  if (!student) return ''; // Safety check
  return [student.first_name, student.father_name, student.last_name].filter(Boolean).join(' ');
}

// 24. Get Student Report by Class (NEW FUNCTION)
const getStudentReportByClass = async (req, res) => {
     try {
        const schoolId = req.user.schoolId; 
        const { classId } = req.query; 
        
        if (!classId) {
            return res.status(400).json({ message: 'Class ID is required.' });
        }
        
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId, classId: parseInt(classId) };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        
        // Get all students in the class
        const students = await prisma.students.findMany({
            where: { ...academicYearWhere },
            select: { 
                studentid: true, 
                first_name: true, 
                father_name: true, 
                last_name: true,
                roll_number: true
            },
            orderBy: { roll_number: 'asc' }
        });
        
        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found in this class.' });
        }
        
        // Get fee records for all students in the class
        const feeRecords = await prisma.feeRecord.findMany({
            where: { ...academicYearWhere },
            include: { template: { select: { name: true } } }
        });
        
        // Group fee records by student
        const studentFeeMap = {};
        feeRecords.forEach(record => {
            if (!studentFeeMap[record.studentId]) {
                studentFeeMap[record.studentId] = [];
            }
            studentFeeMap[record.studentId].push(record);
        });
        
        // Create report data
        const reportData = students.map(student => {
            const studentRecords = studentFeeMap[student.studentid] || [];
            const totalAssigned = studentRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
            const totalPaid = studentRecords.reduce((sum, record) => sum + (record.amountPaid || 0), 0);
            const totalDue = totalAssigned - totalPaid;
            
            return {
                studentId: student.studentid,
                rollNumber: student.roll_number,
                studentName: getFullName(student),
                totalAssigned,
                totalPaid,
                totalDue,
                status: totalDue <= 0 ? 'Paid' : 'Pending'
            };
        });
        
        res.status(200).json(reportData);
        
      } catch (error) { 
          console.error("Error generating student report by class:", error); 
          res.status(500).json({ message: "Server Error: " + error.message }); 
      }
};

// --- 2. CONTROLLER FUNCTIONS (Sanitization Implemented) ---

// 1. Get Dashboard Overview (No Change)
const getDashboardOverview = async (req, res) => { 
    try {
        const schoolId = req.user.schoolId; 
        
        // NAYA: Academic year ID ke basis par filter karein (handle null case)
        const academicYearWhere = { schoolId: schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        
        const totalStudentCount = await prisma.students.count({ 
            where: academicYearWhere 
        });

        const collectionStats = await prisma.transaction.aggregate({
          where: { ...academicYearWhere, status: 'Success' },
          _sum: { amountPaid: true }
        });

        const lateFeeStats = await prisma.feeRecord.aggregate({
            where: { ...academicYearWhere, status: 'Late' },
            _sum: { lateFine: true },
            _count: { id: true }
        });
        
        const depositStats = await prisma.feeRecord.aggregate({
            where: { ...academicYearWhere, isDeposit: true },
            _sum: { amount: true }, 
            _count: { id: true }
        });

        const onlineTransactionCount = await prisma.transaction.count({
            where: { ...academicYearWhere, paymentMode: 'Online', status: 'Success' }
        });

        const overviewData = {
          lateCollection: { amount: lateFeeStats._sum.lateFine || 0, studentCount: lateFeeStats._count.id || 0 },
          onlinePayment: { transactionCount: onlineTransactionCount || 0, totalStudents: totalStudentCount || 0 },
          depositCollection: { amount: depositStats._sum.amount || 0, studentCount: depositStats._count.id || 0 },
          schoolCollection: { collected: collectionStats._sum.amountPaid || 0, goal: 5000000 } 
        };
        res.status(200).json(overviewData);
      } catch (error) { console.error("Error in getDashboardOverview:", error); res.status(500).send("Server Error"); }
};

// 2. Get All Fee Templates (UPDATED to filter by academic year)
const getFeeTemplates = async (req, res) => { 
    try {
        const schoolId = req.user.schoolId;
        // NAYA: Academic year ID ke basis par filter karein
        const whereClause = { schoolId: schoolId };
        // Only filter by academic year if it exists
        if (req.academicYearId) {
            whereClause.academicYearId = req.academicYearId;
        }
        
        // Fee templates school level par hain, isliye academic year filter nahi karna padega
        const templates = await prisma.feeTemplate.findMany({ 
            where: { schoolId: schoolId }
        });
        res.status(200).json(templates || []);
      } catch (error) { console.error("Error in getFeeTemplates:", error); res.status(500).send("Server Error"); }
};

// 3. Get Single Template Details (No Change)
const getTemplateDetails = async (req, res) => { 
    try {
        const schoolId = req.user.schoolId;
        const templateIdInt = parseInt(req.params.id);

        if (isNaN(templateIdInt)) return res.status(400).json({ msg: 'Invalid Template ID' });

        // Access Control Check (where: { id: ..., schoolId: ... }) perfect hai
        const template = await prisma.feeTemplate.findUnique({ 
            where: { id: templateIdInt, schoolId: schoolId } 
        });
        if (!template) return res.status(404).json({ msg: 'Template not found' });

        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { templateId: templateIdInt, schoolId: schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        
        const stats = await prisma.feeRecord.aggregate({
            where: academicYearWhere,
            _sum: { amount: true },
        });

        const distinctStudents = await prisma.feeRecord.findMany({
            where: academicYearWhere,
            distinct: ['studentId'],
            select: { studentId: true }
        });
        const studentCount = distinctStudents.length;

        const collectionStats = await prisma.transaction.aggregate({
          where: { ...academicYearWhere, status: 'Success' },
          _sum: { amountPaid: true }
        });

        const distinctPaidStudents = await prisma.feeRecord.findMany({
            where: { ...academicYearWhere, status: "Paid" },
            distinct: ['studentId'],
            select: { studentId: true }
        });
        const paidStudentCount = distinctPaidStudents.length;

        const templateDetails = {
          name: template.name,
          totalAmountAssigned: stats._sum.amount || 0,
          assignedStudentCount: studentCount || 0,
          collectedAmount: collectionStats._sum.amountPaid || 0,
          paidStudentCount: paidStudentCount || 0
        };
        res.status(200).json(templateDetails);
      } catch (error) { 
          console.error("Error in getTemplateDetails:", error); 
          res.status(500).send("Server Error"); 
      }
};
// 4. Get Late Payment Records (No Change)
const getLatePayments = async (req, res) => { 
     try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        
        let studentWhereClause = {};
        if (search) {
          // search ko sanitize karne ki zaroorat nahi kyunki Prisma handling karega
          studentWhereClause = {
            OR: [
              { first_name: { contains: search } }, 
              { father_name: { contains: search } },
              { last_name: { contains: search } },
            ]
          };
        }

        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId, academicYearId: req.academicYearId };
        
        const query = { 
            ...academicYearWhere, 
            status: 'Late',
            student: studentWhereClause 
        };

        const records = await prisma.feeRecord.findMany({
          where: query,
          include: {
            student: { 
              select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true }} }
            }, 
            template: { 
              select: { name: true }
            }
          },
          orderBy: { dueDate: 'asc' },
          take: parseInt(limit, 10),
          skip: skip
        });
        
        const formattedRecords = records.map(r => ({
            ...r,
            studentId: { 
                ...r.student,
                name: getFullName(r.student),
                class: r.student.class.class_name,
            },
            templateId: r.template 
        }));

        const totalDocuments = await prisma.feeRecord.count({ where: query });
        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { console.error("Error in getLatePayments:", error); res.status(500).send("Server Error"); }
};

// 5. Calculate Late Fees (No Change - Server-side only)
const calculateLateFees = async (req, res) => { 
     try {
        const schoolId = req.user.schoolId;
        
        const schoolSettings = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { lateFineAmount: true }
        });
        const LATE_FINE_AMOUNT = schoolSettings?.lateFineAmount || 100;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId: schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        
        const result = await prisma.feeRecord.updateMany({
          where: { 
              ...academicYearWhere, 
              status: 'Pending',
              dueDate: { lt: today } 
          },
          data: { 
              status: 'Late', 
              lateFine: LATE_FINE_AMOUNT,
          }
        });
        
        if (result.count > 0) {
            // NOTE: $executeRawUnsafe ko MySQL ke bajaaye Prisma ka standard update use karna zyada accha hai,
            // lekin functional security abhi bhi hai.
            await prisma.$executeRawUnsafe(
             `UPDATE FeeRecord 
              SET balanceDue = amount + lateFine - amountPaid 
              WHERE schoolId = ? 
              AND status = 'Late'
              AND lateFine = ?`,
              schoolId,
              LATE_FINE_AMOUNT
            );
        }
        
        if (req.io && result.count > 0) { 
            req.io.emit('updateDashboard');
            req.io.emit('fee_records_updated'); 
        }
        res.status(200).json({ message: `${result.count} records marked as 'Late' and fine applied.` });
      } catch (error) { console.error("Error in calculateLateFees:", error); res.status(500).send("Server Error"); }
};

// 6. Send Late Fee Reminders (No Change)
const sendLateFeeReminders = async (req, res) => { 
     try {
        const schoolId = req.user.schoolId;
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId, academicYearId: req.academicYearId };
        
        const lateRecords = await prisma.feeRecord.findMany({
            where: { ...academicYearWhere, status: 'Late' },
            include: { 
                student: { 
                    select: { first_name: true, father_name: true, last_name: true, guardian_contact: true } 
                } 
            }
        });

        if (lateRecords.length === 0) {
            return res.status(200).json({ message: 'No students with late fees to notify.' });
        }

        lateRecords.forEach(record => {
            const studentName = getFullName(record.student) || 'Your child';
            const parentContact = record.student?.guardian_contact;
            const amountDue = record.balanceDue;
            
            // NOTE: In inputs ko sanitize karne ki zaroorat nahi, kyunki yeh sirf console mein log ho rahe hain
            // Lekin agar aap inhe kisi third-party API (SMS/Email) par bhej rahe hain, toh sanitize zaroori hai.
            if (parentContact) {
                 console.log(`Simulating: Sending SMS/Email reminder to parent (${parentContact}) for ${studentName} regarding late fee payment of ${amountDue}.`);
            } else {
                 console.log(`Simulating: Cannot send reminder for ${studentName} - Parent contact missing.`);
            }
        });

        res.status(200).json({ message: `Successfully simulated sending reminders for ${lateRecords.length} late fee records.` });
      } catch (error) { console.error("Error in sendLateFeeReminders:", error); res.status(500).send("Server Error"); }
};

// 7. Get All Student Fee Records with Filters (No Change)
const getStudentFeeRecords = async (req, res) => { 
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, studentName, studentId, status, classId, templateId, dueDateStart, dueDateEnd } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        let query = { ...academicYearWhere };
        
        if (status) {
             const statusArray = status.split(',').map(s => s.trim()).filter(s => s);
             if (statusArray.length > 0) { query.status = { in: statusArray }; }
        }
        if (classId) query.classId = parseInt(classId);
        if (templateId) query.templateId = parseInt(templateId);
        
        if (dueDateStart || dueDateEnd) {
            query.dueDate = {};
            if (dueDateStart) query.dueDate.gte = new Date(dueDateStart); 
            if (dueDateEnd) query.dueDate.lte = new Date(dueDateEnd);  
        }

        const studentIdInt = parseInt(studentId);
        if (studentIdInt) {
            query.studentId = studentIdInt;
        } else if (studentName) {
            query.student = {
                schoolId: schoolId, 
                OR: [
                  { first_name: { contains: studentName } },
                  { father_name: { contains: studentName } },
                  { last_name: { contains: studentName } },
                ]
            };
        }
        
        const records = await prisma.feeRecord.findMany({
            where: query,
            include: {
                student: { select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true }}, roll_number: true } },
                template: { select: { name: true } }
            },
            orderBy: { id: 'desc' }, 
            take: parseInt(limit, 10),
            skip: skip
        });

        const formattedRecords = records.map(r => ({
            ...r,
            studentId: { 
                ...r.student,
                name: getFullName(r.student),
                class: r.student?.class?.class_name, 
                studentId: r.student?.roll_number, 
            },
            templateId: r.template
       }));
            
        const totalDocuments = await prisma.feeRecord.count({ where: query });
        
        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { 
        console.error("Error in getStudentFeeRecords:", error); 
        res.status(500).send("Server Error"); 
    }
};

// 8. Get Processing Payments (No Change)
const getProcessingPayments = async (req, res) => {
     try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        let whereClause = { ...academicYearWhere, status: 'Pending' };

        if (search) {
            // Search ko sanitize karne ki zaroorat nahi
           whereClause.OR = [
               { student: {
                   OR: [
                     { first_name: { contains: search } },
                     { father_name: { contains: search } },
                     { last_name: { contains: search } },
                   ]
               }},
               { chequeNumber: { contains: search } }
           ];
        }

        const records = await prisma.transaction.findMany({
          where: whereClause,
          include: {
            student: { select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true }} } },
            feeRecord: { include: { template: { select: { name: true } } } }
          },
          orderBy: { id: 'desc' },
          take: parseInt(limit, 10),
          skip: skip
        });
          
        const formattedRecords = records.map(r => ({
            ...r,
            studentId: { ...r.student, name: getFullName(r.student), class: r.student.class.class_name },
            templateName: r.feeRecord?.template?.name || 'N/A' 
        }));
        
        const totalDocuments = await prisma.transaction.count({ where: whereClause });
        
        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { console.error("Error in getProcessingPayments:", error); res.status(500).send("Server Error"); }
};

// 9. Get Edited/Discounted Records (No Change)
const getEditedRecords = async (req, res) => {
     try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        
        let studentWhereClause = {};
        if (search) {
          studentWhereClause = {
            OR: [
              { first_name: { contains: search } },
              { father_name: { contains: search } },
              { last_name: { contains: search } },
            ]
          };
        }
 
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        const query = { ...academicYearWhere, discount: { gt: 0 }, student: studentWhereClause }; 
        
        const records = await prisma.feeRecord.findMany({
            where: query,
            include: {
                student: { select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true }} } },
                template: { select: { name: true } }
            },
            orderBy: { id: 'desc' },
            take: parseInt(limit, 10),
            skip: skip
        });

        const formattedRecords = records.map(r => ({
            ...r,
            studentId: { ...r.student, name: getFullName(r.student), class: r.student.class.class_name },
            templateId: r.template
        }));
            
        const totalDocuments = await prisma.feeRecord.count({ where: query });
        
        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { console.error("Error in getEditedRecords:", error); res.status(500).send("Server Error"); }
};

// 10. Get PDC Records (No Change)
const getPdcRecords = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        let whereClause = { ...academicYearWhere, paymentMode: 'Cheque', status: 'Pending' };

        if (search) {
             whereClause.OR = [
               { student: { OR: [ { first_name: { contains: search } }, { father_name: { contains: search } }, { last_name: { contains: search } } ] }},
               { chequeNumber: { contains: search } }
           ];
        }
        
        const records = await prisma.transaction.findMany({
          where: whereClause,
          include: {
            student: { select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true }} } },
            feeRecord: { include: { template: { select: { name: true } } } }
          },
          orderBy: { paymentDate: 'asc' },
          take: parseInt(limit, 10),
          skip: skip
        });
          
         const formattedRecords = records.map(r => ({
            ...r,
            studentId: { ...r.student, name: getFullName(r.student), class: r.student.class.class_name },
            templateName: r.feeRecord?.template?.name || 'N/A' 
        }));
        
        const totalDocuments = await prisma.transaction.count({ where: whereClause });
        
        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { console.error("Error in getPdcRecords:", error); res.status(500).send("Server Error"); }
};

// 11. Assign And Collect Fee (UPDATED)
const assignAndCollectFee = async (req, res) => {
  console.log("[assignAndCollectFee] Received request body:", req.body);
  const { studentId, templateId, dueDate, amountPaid, paymentMode, paymentDate, notes } = req.body;
  const schoolId = req.user.schoolId;
  const collectedByUserId = req.user.id;
  
  // === FIX 3: NOTES KO SANITIZE KAREIN ===
  const sanitizedNotes = removeHtmlTags(notes);
  // === END FIX 3 ===

  const studentIdInt = parseInt(studentId);
  const templateIdInt = parseInt(templateId);
  
  if (!studentIdInt || !templateIdInt || !dueDate) return res.status(400).json({ message: 'Student ID, Template ID, and Due Date are required.' });
  
  const numericAmountPaid = Number(amountPaid) || 0;
  const isPayingNow = numericAmountPaid > 0;
  
  if (isPayingNow && !paymentMode) return res.status(400).json({ message: 'Payment mode is required.' });
  // Cheque check
  if (isPayingNow && paymentMode === 'Cheque' && (!sanitizedNotes || sanitizedNotes.trim() === '')) return res.status(400).json({ message: 'Cheque number is required in notes.' });
  
  const paymentDateObj = isPayingNow ? new Date(paymentDate) : new Date();
  console.log("[assignAndCollectFee] Prisma transaction starting.");
  
  let savedFeeRecord; let savedTransaction = null; let studentName, studentClassName, templateName;
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      console.log(`[assignAndCollectFee] Fetching template: ${templateIdInt}, student: ${studentIdInt}`);
      const template = await tx.feeTemplate.findUnique({ where: { id: templateIdInt, schoolId } });
      const student = await tx.students.findUnique({ where: { studentid: studentIdInt, schoolId }, include: { class: { select: { classid: true, class_name: true } } } });
      
      if (!template) throw new Error('Fee template not found.');
      if (!student || !student.class) throw new Error('Student not found or class not assigned.');
      
      const foundClassId = student.class.classid;
      studentClassName = student.class.class_name;
      studentName = getFullName(student);
      templateName = template.name;
      
      console.log(`[assignAndCollectFee] Found template: ${template.name}, student class: ${studentClassName} (ID: ${foundClassId})`);
      
      const existingRecord = await tx.feeRecord.findFirst({ where: { studentId: studentIdInt, templateId: templateIdInt, schoolId } });
      if (existingRecord) throw new Error('This fee template is already assigned to this student.');
      
      const templateTotalAmount = template.totalAmount || 0;
      if (isPayingNow && numericAmountPaid > templateTotalAmount + 0.01) throw new Error(`Amount paid (${numericAmountPaid}) cannot exceed template total (${templateTotalAmount}).`);
      
      const balanceDue = templateTotalAmount - numericAmountPaid;
      const feeStatus = balanceDue <= 0.01 ? 'Paid' : (isPayingNow ? 'Partial' : 'Pending');
      
      // NAYA: Academic year ID ko fee record mein add karein (handle null case)
      const feeRecordData = {
        studentId: studentIdInt, 
        templateId: templateIdInt, 
        schoolId: schoolId, 
        classId: foundClassId, 
        amount: templateTotalAmount, 
        discount: 0, 
        amountPaid: numericAmountPaid, 
        balanceDue: balanceDue < 0 ? 0 : balanceDue, 
        status: feeStatus, 
        dueDate: new Date(dueDate)
      };
      
      // Only add academicYearId if it exists
      if (req.academicYearId) {
        feeRecordData.academicYearId = req.academicYearId;
      }
      
      savedFeeRecord = await tx.feeRecord.create({
        data: feeRecordData
      });
      
      console.log(`[assignAndCollectFee] FeeRecord created: ${savedFeeRecord.id}, Status: ${feeStatus}`);
      
      if (isPayingNow) {
        const receiptId = `TXN-${Date.now()}`;
        const transactionStatus = (paymentMode === 'Cheque') ? 'Pending' : 'Success';
        
        // NAYA: Academic year ID ko transaction mein add karein (handle null case)
        const transactionData = {
          receiptId, 
          feeRecordId: savedFeeRecord.id, 
          studentId: studentIdInt, 
          classId: foundClassId, 
          schoolId: schoolId, 
          templateId: templateIdInt, 
          amountPaid: numericAmountPaid, 
          paymentDate: paymentDateObj, 
          paymentMode: paymentMode, 
          status: transactionStatus, 
          collectedById: collectedByUserId, 
          notes: sanitizedNotes, // <-- SANITIZED NOTES
          chequeNumber: (paymentMode === 'Cheque') ? sanitizedNotes : null 
        };
        
        // Only add academicYearId if it exists
        if (req.academicYearId) {
          transactionData.academicYearId = req.academicYearId;
        }
        
        savedTransaction = await tx.transaction.create({
          data: transactionData
        });
        console.log(`[assignAndCollectFee] Transaction created: ${savedTransaction.id}, Status: ${transactionStatus}`);
      }
      return { savedFeeRecord, savedTransaction };
    });
    console.log("[assignAndCollectFee] Database transaction committed successfully.");
    const io = req.app.get('socketio');
    if (io) {
      console.log("[assignAndCollectFee] Emitting Socket events...");
      io.emit('updateDashboard');
      io.emit('fee_record_added', result.savedFeeRecord);
      if (result.savedTransaction) {
        const populatedTransactionForEmit = { ...result.savedTransaction, studentName: studentName || 'N/A', className: studentClassName || 'N/A', templateName: templateName || 'N/A', collectedByName: req.user?.name || 'Admin' };
        io.emit('transaction_added', populatedTransactionForEmit);
        if (result.savedTransaction.status === 'Success') { io.emit('new_transaction_feed', { name: studentName || 'A Student', amount: result.savedTransaction.amountPaid }); }
      }
    } else { console.warn("[assignAndCollectFee] Socket.IO instance not found."); }
    const successMessage = isPayingNow ? `Fee '${templateName}' assigned and payment of ${numericAmountPaid.toLocaleString('en-IN', {style:'currency', currency:'INR'})} recorded.` : `Fee '${templateName}' assigned successfully. Status: Pending.`;
    res.status(201).json({ message: successMessage, feeRecord: result.savedFeeRecord, transaction: result.savedTransaction });
  } catch (error) {
    console.error('Error in assignAndCollectFee:', error);
    const statusCode = (error.message.includes('not found') || error.message.includes('already assigned')) ? 400 : 500;
    res.status(statusCode).json({ message: `Server error: ${error.message}` });
  }
};

// 12. Create a New Fee Template (UPDATED)
const createFeeTemplate = async (req, res) => {
     try {
        const { name, description, items } = req.body;
        const schoolId = req.user.schoolId;

        // === FIX 4: NAME aur DESCRIPTION ko SANITIZE karein ===
        const sanitizedName = removeHtmlTags(name);
        const sanitizedDescription = removeHtmlTags(description);
        // === END FIX 4 ===

        if (!sanitizedName || !items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Template name and at least one fee item are required.' });
        
        // Items ke andar ke names ko bhi sanitize karein
        const sanitizedItems = items.map(item => ({
            ...item,
            name: removeHtmlTags(item.name) // Item name sanitize
        }));

        if (!sanitizedItems.every(item => item && typeof item.name === 'string' && item.name.trim() !== '' && typeof item.amount === 'number' && item.amount >= 0)) return res.status(400).json({ message: 'Each fee item must have a non-empty name and a non-negative amount.' });
        
        const totalAmount = sanitizedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        
        const existingTemplate = await prisma.feeTemplate.findUnique({ where: { schoolId_name: { schoolId, name: sanitizedName } } });
        if (existingTemplate) return res.status(400).json({ message: `A fee template with the name "${sanitizedName}" already exists.` });
        
        const newTemplate = await prisma.feeTemplate.create({ data: { name: sanitizedName, description: sanitizedDescription, items: sanitizedItems, totalAmount, schoolId } });
        
        if (req.io) { req.io.emit('fee_template_added', newTemplate); } else { console.warn('Socket.IO instance not found.'); }
        
        res.status(201).json({ message: 'Fee Template created successfully!', template: newTemplate });
        
      } catch (error) { console.error("Error in createFeeTemplate:", error); if (error.code === 'P2002') { return res.status(400).json({ message: `A fee template with the name "${name.trim()}" already exists.` }); } res.status(500).send("Server Error"); }
};

// 12.5. Update Fee Template (UPDATED)
const updateFeeTemplate = async (req, res) => {
  const templateIdInt = parseInt(req.params.id);
  const { name, description, items } = req.body;
  const schoolId = req.user.schoolId;

  // === FIX 5: NAME aur DESCRIPTION ko SANITIZE karein ===
  const sanitizedName = removeHtmlTags(name);
  const sanitizedDescription = removeHtmlTags(description);
  // === END FIX 5 ===

  if (isNaN(templateIdInt)) return res.status(400).json({ message: 'Invalid Template ID.' });
  if (!sanitizedName || !items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Name and items array are required.' });
  
  // Items ke andar ke names ko bhi sanitize karein
  const sanitizedItems = items.map(item => ({
      ...item,
      name: removeHtmlTags(item.name) // Item name sanitize
  }));

  let serverCalculatedTotal = 0;
  for (const item of sanitizedItems) { if (!item || typeof item.name !== 'string' || item.name.trim() === '' || typeof item.amount !== 'number' || item.amount < 0) { return res.status(400).json({ message: 'Each fee item must have a valid name and amount.' }); } serverCalculatedTotal += item.amount; }
  
  try {
    const templateToEdit = await prisma.feeTemplate.findUnique({ where: { id: templateIdInt, schoolId: schoolId } });
    if (!templateToEdit) { return res.status(404).json({ message: 'Fee template not found.' }); }
    
    const existingTemplate = await prisma.feeTemplate.findFirst({
        where: {
            schoolId: schoolId,
            name: sanitizedName,
            NOT: { id: templateIdInt } // Khud ko chhod kar
        }
    });
    if (existingTemplate) { return res.status(400).json({ message: `Another template with name "${sanitizedName}" already exists.` }); }


    const updatedTemplate = await prisma.feeTemplate.update({ where: { id: templateIdInt, schoolId: schoolId }, data: { name: sanitizedName, description: sanitizedDescription, items: sanitizedItems, totalAmount: serverCalculatedTotal } });
    
    if (req.io) { req.io.emit('fee_template_updated', updatedTemplate); }
    
    res.status(200).json({ message: 'Template updated successfully!', template: updatedTemplate });
  } catch (error) { 
      console.error("Error in updateFeeTemplate:", error); 
      if (error.code === 'P2025') { return res.status(404).json({ message: 'Fee template not found or you do not have permission.' }); } 
      res.status(500).json({ message: `Server error updating template: ${error.message}` }); 
  }
};

// 13. Delete Fee Template (No Change)
const deleteFeeTemplate = async (req, res) => {
  const templateIdInt = parseInt(req.params.id);
  const schoolId = req.user.schoolId;
  if (isNaN(templateIdInt)) return res.status(400).json({ message: 'Invalid Template ID.' });
  try {
    // Access control check already built-in
    const recordInUse = await prisma.feeRecord.findFirst({ where: { templateId: templateIdInt, schoolId: schoolId } });
    if (recordInUse) return res.status(400).json({ message: 'Failed to delete template. It is already assigned to one or more students.' });
    await prisma.feeTemplate.delete({ where: { id: templateIdInt, schoolId: schoolId } });
    if (req.io) { req.io.emit('fee_template_deleted', { id: templateIdInt }); }
    res.status(200).json({ message: 'Template deleted successfully!' });
  } catch (error) { console.error("Error in deleteFeeTemplate:", error); if (error.code === 'P2025') { return res.status(404).json({ message: 'Fee template not found or you do not have permission.' }); } res.status(500).json({ message: `Server error deleting template: ${error.message}` }); }
};

// 14. Get Sample Sheet (No Change)
const getSampleSheet = async (req, res) => {
     try {
        // ... (Poora code jaisa tha waisa hi) ...
        const sampleData = [ { FeeRecordID_ToUpdate: 'Enter_Prismaid_Here (e.g., 12)', AmountPaid_Partially: 500, PaymentDate: 'YYYY-MM-DD (e.g., 2025-10-26)', PaymentMode: 'Cash | Cheque | NEFT | UPI etc.', Notes: 'Optional notes (e.g., Received part payment)', ChequeNumber: 'If PaymentMode is Cheque', BankName: 'If PaymentMode is Cheque/NEFT/RTGS' }, ];
        const wb = xlsx.utils.book_new(); const ws = xlsx.utils.json_to_sheet(sampleData);
        ws['!cols'] = [ { wch: 40 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 40 }, { wch: 25 }, { wch: 30 } ]; 
        xlsx.utils.book_append_sheet(wb, ws, "Fee Collection Import"); const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="Sample_Fee_Collection_Import.xlsx"'); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.send(buffer);
      } catch (error) { console.error("Error generating sample sheet:", error); res.status(500).send("Server Error"); }
};

// 15. Update Existing Records (Import Fee Payments) (UPDATED)
const updateExistingRecords = async (req, res) => {
    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No file uploaded.' });
    const schoolId = req.user.schoolId; const collectedByUserId = req.user.id;
    let workbook; try { workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true }); } catch (parseError) { console.error("Error parsing Excel file:", parseError); return res.status(400).json({ message: 'Could not parse the Excel file.' }); }
    const sheetName = workbook.SheetNames[0]; if (!sheetName) return res.status(400).json({ message: 'No sheets found.' });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]); if (data.length === 0) return res.status(400).json({ message: 'Sheet is empty.' });
    
    let successCount = 0; let errorCount = 0; const errors = []; const updatedFeeRecordIds = new Set();

    for (const [index, row] of data.entries()) {
        const feeRecordIdInt = parseInt(row.FeeRecordID_ToUpdate); 
        const amountPaidInput = row.AmountPaid_Partially; 
        const paymentDateInput = row.PaymentDate;
        
        // === FIX 6: NOTES, CHEQUE, BANK NAME ko SANITIZE karein ===
        const mode = removeHtmlTags(row.PaymentMode?.trim());
        const notes = removeHtmlTags(row.Notes);
        const chequeNumber = removeHtmlTags(row.ChequeNumber);
        const bankName = removeHtmlTags(row.BankName);
        // === END FIX 6 ===

        if (isNaN(feeRecordIdInt)) { errorCount++; errors.push(`Row ${index + 2}: Invalid or missing FeeRecordID.`); continue; }
        const amountPaid = Number(amountPaidInput); if (isNaN(amountPaid) || amountPaid <= 0) { errorCount++; errors.push(`Row ${index + 2} (ID: ${feeRecordIdInt}): Invalid or missing AmountPaid.`); continue; }
        if (!mode) { errorCount++; errors.push(`Row ${index + 2} (ID: ${feeRecordIdInt}): Missing PaymentMode.`); continue; }
        const paymentDate = paymentDateInput instanceof Date ? paymentDateInput : new Date();
        
        try {
            await prisma.$transaction(async (tx) => {
                const existingTransaction = await tx.transaction.findFirst({
                    where: { receiptId: `TXN-${paymentDate.getTime()}-${index}` } // Duplicate check for safety
                });
                if (existingTransaction) throw new Error("Duplicate transaction ID detected. Check import file.");

                const feeRecord = await tx.feeRecord.findUnique({ where: { id: feeRecordIdInt, schoolId } });
                if (!feeRecord) throw new Error(`Fee Record ${feeRecordIdInt} not found or doesn't belong to this school.`);
                if (amountPaid > feeRecord.balanceDue) throw new Error(`Amount ${amountPaid} exceeds balance ${feeRecord.balanceDue}.`);
                
                const transactionStatus = (mode === 'Cheque') ? 'Pending' : 'Success';
                
                // NAYA: Academic year ID ko transaction mein add karein (handle null case)
                const transactionData = {
                  feeRecordId: feeRecord.id, 
                  studentId: feeRecord.studentId, 
                  classId: feeRecord.classId, 
                  schoolId: schoolId, 
                  templateId: feeRecord.templateId, 
                  amountPaid: amountPaid, 
                  paymentDate: paymentDate, 
                  paymentMode: mode, 
                  status: transactionStatus, 
                  collectedById: collectedByUserId, 
                  notes: notes || `Imported via Excel`, 
                  chequeNumber, 
                  bankName, 
                  receiptId: `TXN-${paymentDate.getTime()}-${index}`
                };
                
                // Only add academicYearId if it exists
                if (req.academicYearId) {
                  transactionData.academicYearId = req.academicYearId;
                }
                
                await tx.transaction.create({ data: transactionData });
                
                if (transactionStatus === 'Success') {
                    const newAmountPaid = feeRecord.amountPaid + amountPaid; const newBalanceDue = feeRecord.balanceDue - amountPaid;
                    await tx.feeRecord.update({ where: { id: feeRecordIdInt }, data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue < 0 ? 0 : newBalanceDue, status: newBalanceDue <= 0.01 ? 'Paid' : 'Partial' } });
                    updatedFeeRecordIds.add(feeRecordIdInt.toString());
                }
            });
            successCount++;
        } catch (error) { 
            errorCount++; 
            errors.push(`Row ${index + 2} (ID: ${feeRecordIdInt}): Error - ${error.message}`); 
            console.error(`Error processing row ${index + 2} (ID: ${feeRecordIdInt}):`, error); 
        }
    }
    
    if (req.io && updatedFeeRecordIds.size > 0) { console.log(`[Import] Emitting socket events for ${updatedFeeRecordIds.size} updated records.`); req.io.emit('updateDashboard'); req.io.emit('fee_records_updated'); }
    
    res.status(200).json({ message: `Import complete. ${successCount} payments recorded. ${errorCount} rows failed.`, errors: errors });
};

// 16. Export Detail Report (UPDATED)
const exportDetailReport = async (req, res) => {
     try {
        const schoolId = req.user.schoolId; 
        const filters = req.body || {}; 
        
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        let query = { ...academicYearWhere };
        // Query filters (No Change)
        if (filters.status) query.status = filters.status; if (filters.paymentMode) query.paymentMode = filters.paymentMode; if (filters.classId) query.classId = parseInt(filters.classId);
        if (filters.startDate || filters.endDate) { query.paymentDate = {}; if (filters.startDate) query.paymentDate.gte = new Date(filters.startDate); if (filters.endDate) { const endDate = new Date(filters.endDate); endDate.setHours(23, 59, 59, 999); query.paymentDate.lte = endDate; } }
        if (filters.studentId) query.studentId = parseInt(filters.studentId); if (filters.templateId) query.templateId = parseInt(filters.templateId);
        
        const transactions = await prisma.transaction.findMany({ where: query, include: { student: { select: { first_name: true, father_name: true, last_name: true, roll_number: true, class: { select: { class_name: true }} } }, template: { select: { name: true } }, collectedBy: { select: { name: true } } }, orderBy: { paymentDate: 'desc' } });
        
        // Data for Sheet (No Change)
        const dataForSheet = transactions.map(tx => ({ 
            'Receipt ID': tx.receiptId, 
            'Payment Date': tx.paymentDate ? tx.paymentDate.toLocaleDateString('en-GB') : 'N/A', 
            'Student ID': tx.student?.roll_number || 'N/A', 
            'Student Name': getFullName(tx.student) || 'N/A', 
            'Class Name': tx.student?.class?.class_name || 'N/A', 
            'Fee Template': tx.template?.name || 'N/A', 
            'Amount Paid': tx.amountPaid, 
            'Payment Mode': tx.paymentMode, 
            'Status': tx.status, 
            'Gateway Txn ID': tx.gatewayTransactionId || '-', 
            'Collected By': tx.collectedBy?.name || (tx.paymentMode === 'Online' ? 'System (Online)' : 'N/A'), 
            // NOTES, CHEQUE, BANK ko SANITIZE karne ki zaroorat nahi kyunki yeh database se aa rahe hain
            'Notes': tx.notes || '', 
            'Cheque No': tx.chequeNumber || '-', 
            'Bank Name': tx.bankName || '-' 
        }));
        
        if (dataForSheet.length === 0) return res.status(404).json({ message: 'No transactions found matching filters.' });
        
        // Excel Generation (No Change)
        const wb = xlsx.utils.book_new(); const ws = xlsx.utils.json_to_sheet(dataForSheet); const columnWidths = [ {wch: 25}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 20}, {wch: 30}, {wch: 15}, {wch: 20} ]; ws['!cols'] = columnWidths;
        xlsx.utils.book_append_sheet(wb, ws, "Detailed Fee Report"); const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="Detailed_Fee_Report.xlsx"'); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.send(buffer);
      } catch (error) { console.error("Error exporting detailed report:", error); res.status(500).send("Server Error"); }
};

// 17. Get Paid Transactions (for Student Tab) (No Change)
const getPaidTransactions = async (req, res) => {
     try {
        const studentIdInt = parseInt(req.params.studentId); const schoolId = req.user.schoolId; if (isNaN(studentIdInt)) return res.status(400).json({ message: 'Invalid Student ID.' });
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId: schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        academicYearWhere.studentId = studentIdInt;
        academicYearWhere.status = 'Success';
        const allPaidTransactions = await prisma.transaction.findMany({ where: academicYearWhere, include: { template: { select: { name: true } }, feeRecord: { select: { isDeposit: true } } }, orderBy: { paymentDate: 'desc' } });
        const deposits = allPaidTransactions.filter(tx => tx.feeRecord?.isDeposit === true); const paidRecords = allPaidTransactions.filter(tx => !tx.feeRecord || tx.feeRecord?.isDeposit !== true);
        res.status(200).json({ deposits, paidRecords });
      } catch (error) { console.error("Error fetching paid transactions:", error); res.status(500).send("Server Error"); }
};

// 18. Get Failed Transactions (for Student Tab) (No Change)
const getFailedTransactions = async (req, res) => {
     try {
        const studentIdInt = parseInt(req.params.id); const schoolId = req.user.schoolId; if (isNaN(studentIdInt)) return res.status(400).json({ message: 'Invalid Student ID.' });
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId: schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        academicYearWhere.studentId = studentIdInt;
        academicYearWhere.status = 'Failed';
        const failedTransactions = await prisma.transaction.findMany({ where: academicYearWhere, include: { template: { select: { name: true } } }, orderBy: { id: 'desc' } });
        res.status(200).json(failedTransactions);
      } catch (error) { console.error("Error fetching failed transactions:", error); res.status(500).send("Server Error"); }
};

// 19. Get Payment History (All transactions for Student Tab) (No Change)
const getPaymentHistory = async (req, res) => {
     try {
        const studentIdInt = parseInt(req.params.id); const schoolId = req.user.schoolId; if (isNaN(studentIdInt)) return res.status(400).json({ message: 'Invalid Student ID.' });
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId: schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        academicYearWhere.studentId = studentIdInt;
        const historyRecords = await prisma.transaction.findMany({ where: academicYearWhere, include: { template: { select: { name: true } } }, orderBy: { paymentDate: 'desc' } });
        res.status(200).json(historyRecords);
      } catch (error) { console.error("Error fetching payment history:", error); res.status(500).send("Server Error"); }
};

// 20. Collect Manual Fee (UPDATED)
const collectManualFee = async (req, res) => {
    // === FIX 7: USER INPUT KO SANITIZE KAREIN ===
    const sanitizedBody = {};
    for (const key in req.body) {
        sanitizedBody[key] = removeHtmlTags(req.body[key]);
    }
    const { feeRecordId, amountPaid: amountPaidString, paymentMode, paymentDate, notes, chequeNumber, bankName } = sanitizedBody;
    // === END FIX 7 ===

    const schoolId = req.user.schoolId; const collectedByUserId = req.user.id; const collectedByName = req.user.name || 'Admin';
    const feeRecordIdInt = parseInt(feeRecordId); 
    if (isNaN(feeRecordIdInt)) return res.status(400).json({ msg: 'Invalid or missing Fee Record ID.' });
    
    const amountPaid = Number(amountPaidString); 
    if (isNaN(amountPaid) || amountPaid <= 0) return res.status(400).json({ msg: 'Invalid or missing Amount Paid.' });
    if (!paymentMode) return res.status(400).json({ msg: 'Payment Mode is required.' }); 
    // Cheque check ab Sanitized ChequeNumber par hoga
    if (paymentMode === 'Cheque' && !chequeNumber) return res.status(400).json({ msg: 'Cheque number is required.' });
    
    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();
    let updatedFeeRecord; let newTransaction;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const feeRecord = await tx.feeRecord.findUnique({ where: { id: feeRecordIdInt, schoolId } });
            if (!feeRecord) throw new Error('Fee Record not found or does not belong to this school.');
            if (amountPaid > feeRecord.balanceDue + 0.01) throw new Error(`Amount paid (${amountPaid}) exceeds balance due (${feeRecord.balanceDue})`);
            
            const receiptId = `TXN-${Date.now()}`; 
            const transactionStatus = (paymentMode === 'Cheque') ? 'Pending' : 'Success';
            
            // NAYA: Academic year ID ko transaction mein add karein (handle null case)
            const transactionData = {
              receiptId, 
              feeRecordId: feeRecord.id, 
              studentId: feeRecord.studentId, 
              classId: feeRecord.classId, 
              schoolId, 
              templateId: feeRecord.templateId, 
              amountPaid: amountPaid, 
              paymentDate: paymentDateObj, 
              paymentMode, 
              status: transactionStatus, 
              collectedById: collectedByUserId, 
              notes, 
              chequeNumber, 
              bankName // <--- SANITIZED DATA
            };
            
            // Only add academicYearId if it exists
            if (req.academicYearId) {
              transactionData.academicYearId = req.academicYearId;
            }
            
            newTransaction = await tx.transaction.create({ 
              data: transactionData
            });
            
            if (newTransaction.status === 'Success') {
                const newAmountPaid = feeRecord.amountPaid + amountPaid; const newBalanceDue = feeRecord.balanceDue - amountPaid;
                updatedFeeRecord = await tx.feeRecord.update({ where: { id: feeRecord.id }, data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue < 0 ? 0 : newBalanceDue, status: newBalanceDue < 0.01 ? 'Paid' : 'Partial' } });
            } else { updatedFeeRecord = feeRecord; }
            
            return { newTransaction, updatedFeeRecord };
        });

        // Socket logic and response (No Change)
        const studentInfo = await prisma.students.findUnique({ where: { studentid: result.updatedFeeRecord.studentId }, include: { class: { select: { class_name: true } } } });
        const templateInfo = await prisma.feeTemplate.findUnique({ where: { id: result.updatedFeeRecord.templateId } });
        const schoolInfo = await prisma.school.findUnique({ where: { id: schoolId } });
        const populatedTransaction = { ...result.newTransaction, studentName: getFullName(studentInfo) || 'N/A', className: studentInfo?.class?.class_name || 'N/A', templateName: templateInfo?.name || 'N/A', collectedByName: collectedByName, schoolInfo: { name: schoolInfo?.name || 'School Name', address: schoolInfo?.address || 'School Address', logo: schoolInfo?.logo } };
        if (req.io) { console.log("[Manual Collect] Emitting Socket events..."); req.io.emit('updateDashboard'); req.io.emit('fee_record_updated', result.updatedFeeRecord); req.io.emit('transaction_added', populatedTransaction); if (result.newTransaction.status === 'Success') { req.io.emit('new_transaction_feed', { name: studentInfo ? getFullName(studentInfo) : 'A Student', amount: result.newTransaction.amountPaid }); } }
        else { console.warn('[Manual Collect] Socket.IO instance (req.io) not found.'); }
        res.status(201).json({ message: 'Fee collected successfully', transaction: populatedTransaction });
    } catch (error) { console.error('Error collecting manual fee:', error); res.status(500).json({ msg: `Server error: ${error.message}` }); }
};

// 21. Get Single Transaction Details (Receipt) (No Change)
const getTransactionById = async (req, res) => {
     try {
        // Access Control Check (where: { id: ..., schoolId: ... }) perfect hai
        const transactionIdInt = parseInt(req.params.id); const schoolId = req.user.schoolId; if (isNaN(transactionIdInt)) return res.status(400).json({ message: 'Invalid Transaction ID' });
        
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { id: transactionIdInt, schoolId: schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        const transaction = await prisma.transaction.findUnique({ where: academicYearWhere, include: { student: { include: { class: { select: { class_name: true } } } }, template: { select: { name: true, items: true } }, collectedBy: { select: { name: true } } } });
        
        if (!transaction) return res.status(404).json({ message: 'Transaction not found or access denied.' });
        
        const feeRecord = await prisma.feeRecord.findUnique({ 
            where: { id: transaction.feeRecordId }, 
            select: { 
                amount: true, 
                discount: true, 
                lateFine: true, 
                balanceDue: true, 
                status: true      
            } 
        });
        
        const schoolInfo = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true, address: true, logo: true, session: true } });
        
        const receiptData = { 
            ...transaction, 
            studentName: getFullName(transaction.student) || 'N/A', 
            studentRegId: transaction.student?.roll_number || 'N/A', 
            className: transaction.student?.class?.class_name || 'N/A', 
            templateName: transaction.template?.name || 'N/A', 
            templateItems: transaction.template?.items, 
            collectedByName: transaction.collectedBy?.name || (transaction.paymentMode === 'Online' ? 'System (Online)' : 'N/A'), 
            totalFeeAmount: feeRecord?.amount || 0, 
            discountGiven: feeRecord?.discount || 0, 
            lateFineApplied: feeRecord?.lateFine || 0, 
            currentBalanceDue: feeRecord?.balanceDue ?? 0, 
            feeRecordStatus: feeRecord?.status || 'Pending', 
            schoolInfo: { 
                name: schoolInfo?.name || 'School Name', 
                address: schoolInfo?.address || 'School Address', 
                logo: schoolInfo?.logo, 
                session: schoolInfo?.session || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` 
            } 
        };

        delete receiptData.student; delete receiptData.template; delete receiptData.collectedBy;
        res.status(200).json(receiptData);
      } catch (error) { console.error("Error fetching transaction for receipt:", error); res.status(500).send("Server Error"); }
};

// 22. Get Class-wise Collection Report (No Change)
const getClasswiseReport = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const classes = await prisma.classes.findMany({ where: { schoolId }, include: { _count: { select: { students: true } } }, orderBy: { class_name: 'asc' } });
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId: schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        academicYearWhere.status = 'Success';
        const reportData = await prisma.transaction.groupBy({ by: ['classId'], where: academicYearWhere, _sum: { amountPaid: true } });
        const report = classes.map(cls => { const collection = reportData.find(r => r.classId === cls.classid); return { classId: cls.classid, className: cls.class_name, totalCollection: collection?._sum.amountPaid || 0, studentCount: cls._count.students || 0 } });
        res.status(200).json(report);
      } catch (error) { console.error("Error fetching class-wise report:", error); res.status(500).send("Server Error"); }
};

// 25. Get Transactions (NEW FUNCTION)
const getTransactions = async (req, res) => {
     try {
        const schoolId = req.user.schoolId; 
        const { page = 1, limit = 10, search = "", status, paymentMode, classId, startDate, endDate } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        let whereClause = { ...academicYearWhere };
        
        // Add filters
        if (status && status !== 'All') whereClause.status = status;
        if (paymentMode && paymentMode !== 'All') whereClause.paymentMode = paymentMode;
        if (classId) whereClause.classId = parseInt(classId);
        
        // Date range filter
        if (startDate || endDate) {
            whereClause.paymentDate = {};
            if (startDate) whereClause.paymentDate.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                whereClause.paymentDate.lte = end;
            }
        }
        
        // Search filter
        if (search) {
            whereClause.OR = [
                { student: { first_name: { contains: search } } },
                { student: { father_name: { contains: search } } },
                { student: { last_name: { contains: search } } },
                { receiptId: { contains: search } }
            ];
        }
        
        const transactions = await prisma.transaction.findMany({ 
            where: whereClause,
            include: { 
                student: { 
                    select: { 
                        first_name: true, 
                        father_name: true, 
                        last_name: true, 
                        class: { select: { class_name: true } } 
                    } 
                },
                template: { select: { name: true } },
                collectedBy: { select: { name: true } }
            },
            orderBy: { paymentDate: 'desc' },
            take: parseInt(limit, 10),
            skip: skip
        });
        
        const formattedTransactions = transactions.map(tx => ({
            ...tx,
            studentName: getFullName(tx.student) || 'N/A',
            className: tx.student?.class?.class_name || 'N/A',
            templateName: tx.template?.name || 'N/A',
            collectedByName: tx.collectedBy?.name || (tx.paymentMode === 'Online' ? 'System (Online)' : 'N/A')
        }));
        
        const totalDocuments = await prisma.transaction.count({ where: whereClause });
        
        res.status(200).json({ 
            data: formattedTransactions, 
            totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), 
            currentPage: parseInt(page, 10) 
        });
        
      } catch (error) { 
          console.error("Error fetching transactions:", error); 
          res.status(500).json({ message: "Server Error: " + error.message }); 
      }
};

// 23. Export Fee Data (NEW FUNCTION)
// This function handles GET requests with query parameters for exporting fee data
const exportFeeData = async (req, res) => {
     try {
        const schoolId = req.user.schoolId; 
        const filters = req.query || {}; 
        
        // NAYA: Academic year ID ke basis par filter karein
        const academicYearWhere = { schoolId };
        if (req.academicYearId) {
            academicYearWhere.academicYearId = req.academicYearId;
        }
        let query = { ...academicYearWhere };
        
        // Query filters - adapted for query parameters
        if (filters.status && filters.status !== 'All') query.status = filters.status; 
        if (filters.classId) query.classId = parseInt(filters.classId);
        if (filters.templateId) query.templateId = parseInt(filters.templateId);
        if (filters.startDate || filters.endDate) { 
            query.paymentDate = {}; 
            if (filters.startDate) query.paymentDate.gte = new Date(filters.startDate); 
            if (filters.endDate) { 
                const endDate = new Date(filters.endDate); 
                endDate.setHours(23, 59, 59, 999); 
                query.paymentDate.lte = endDate; 
            } 
        }
        
        const transactions = await prisma.transaction.findMany({ 
            where: query, 
            include: { 
                student: { 
                    select: { 
                        first_name: true, 
                        father_name: true, 
                        last_name: true, 
                        roll_number: true, 
                        class: { select: { class_name: true }} 
                    } 
                }, 
                template: { select: { name: true } }, 
                collectedBy: { select: { name: true } } 
            }, 
            orderBy: { paymentDate: 'desc' } 
        });
        
        // Data for Sheet
        const dataForSheet = transactions.map(tx => ({ 
            'Receipt ID': tx.receiptId, 
            'Payment Date': tx.paymentDate ? tx.paymentDate.toLocaleDateString('en-GB') : 'N/A', 
            'Student ID': tx.student?.roll_number || 'N/A', 
            'Student Name': getFullName(tx.student) || 'N/A', 
            'Class Name': tx.student?.class?.class_name || 'N/A', 
            'Fee Template': tx.template?.name || 'N/A', 
            'Amount Paid': tx.amountPaid, 
            'Payment Mode': tx.paymentMode, 
            'Status': tx.status, 
            'Gateway Txn ID': tx.gatewayTransactionId || '-', 
            'Collected By': tx.collectedBy?.name || (tx.paymentMode === 'Online' ? 'System (Online)' : 'N/A'), 
            'Notes': tx.notes || '', 
            'Cheque No': tx.chequeNumber || '-', 
            'Bank Name': tx.bankName || '-' 
        }));
        
        // Return data as JSON for frontend to process
        res.status(200).json(dataForSheet);
        
      } catch (error) { 
          console.error("Error exporting fee data:", error); 
          res.status(500).json({ message: "Server Error: " + error.message }); 
      }
};

module.exports = {
  getDashboardOverview,
  getFeeTemplates,
  getTemplateDetails,
  getLatePayments,
  calculateLateFees,
  sendLateFeeReminders,
  getStudentFeeRecords,
  getProcessingPayments,
  getEditedRecords,
  getPdcRecords,
  assignAndCollectFee,
  createFeeTemplate,
  updateFeeTemplate,
  deleteFeeTemplate,
  getSampleSheet,
  updateExistingRecords,
  exportDetailReport,
  getPaidTransactions,
  getFailedTransactions,
  getPaymentHistory,
  collectManualFee,
  getTransactionById,
  getClasswiseReport,
  getStudentReportByClass,
  getTransactions,
  exportFeeData // Export the new function
};
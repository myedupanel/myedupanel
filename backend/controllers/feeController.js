// backend/controllers/feeController.js

// --- 1. IMPORTS (Corrected: Sirf Prisma aur zaroori libraries) ---
const prisma = require('../config/prisma'); // Sirf Prisma client
const xlsx = require('xlsx');
const Razorpay = require('razorpay');
const crypto = require('crypto'); // Webhook ke liye zaroori
// --- Mongoose models (Student, FeeRecord, School, etc.) hata diye gaye ---

// --- FIX: Razorpay initialization ko top se hata diya ---
// const razorpay = new Razorpay({ ... });

// Helper function student ka poora naam jodne ke liye
const getFullName = (student) => {
    if (!student) return 'N/A';
    return [student.first_name, student.father_name, student.last_name].filter(Boolean).join(' ');
}

// --- 2. CONTROLLER FUNCTIONS (Prisma Logic) ---

// 1. Get Dashboard Overview
const getDashboardOverview = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;

        const totalStudentCount = await prisma.students.count({
            where: { schoolId: schoolId }
        });

        const collectionStats = await prisma.transaction.aggregate({
            where: { schoolId: schoolId, status: 'Success' },
            _sum: { amountPaid: true }
        });

        // Prisma aggregation doesn't easily support $cond, so we do it separately
        const lateFeeStats = await prisma.feeRecord.aggregate({
            where: { schoolId: schoolId, status: 'Late' },
            _sum: { lateFine: true },
            _count: { id: true }
        });
        
        const depositStats = await prisma.feeRecord.aggregate({
            where: { schoolId: schoolId, isDeposit: true }, // Assuming isDeposit field exists
            _sum: { amount: true },
            _count: { id: true }
        });

        const onlineTransactionCount = await prisma.transaction.count({
            where: { schoolId: schoolId, paymentMode: 'Online', status: 'Success' }
        });

        const overviewData = {
            lateCollection: { amount: lateFeeStats._sum.lateFine || 0, studentCount: lateFeeStats._count.id || 0 },
            onlinePayment: { transactionCount: onlineTransactionCount || 0, totalStudents: totalStudentCount || 0 },
            depositCollection: { amount: depositStats._sum.amount || 0, studentCount: depositStats._count.id || 0 },
            schoolCollection: { collected: collectionStats._sum.amountPaid || 0, goal: 5000000 } // Example goal
        };
        res.status(200).json(overviewData);
    } catch (error) { console.error("Error in getDashboardOverview:", error); res.status(500).send("Server Error"); }
};

// 2. Get All Fee Templates
const getFeeTemplates = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const templates = await prisma.feeTemplate.findMany({
            where: { schoolId: schoolId }
            // select: { id: true, name: true } // Only select needed fields
        });
        res.status(200).json(templates || []);
    } catch (error) { console.error("Error in getFeeTemplates:", error); res.status(500).send("Server Error"); }
};

// 3. Get Single Template Details
const getTemplateDetails = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const templateIdInt = parseInt(req.params.id);

        if (isNaN(templateIdInt)) return res.status(400).json({ msg: 'Invalid Template ID' });

        const template = await prisma.feeTemplate.findUnique({
            where: { id: templateIdInt, schoolId: schoolId }
        });
        if (!template) return res.status(404).json({ msg: 'Template not found' });

        // Fee record stats
        const stats = await prisma.feeRecord.aggregate({
            where: { templateId: templateIdInt, schoolId: schoolId },
            _sum: { amount: true },
        });
        // Use distinct count
        const studentCountResult = await prisma.feeRecord.groupBy({
             by: ['studentId'],
             where: { templateId: templateIdInt, schoolId: schoolId },
        });
        const studentCount = studentCountResult.length;


        // Transaction stats
        const collectionStats = await prisma.transaction.aggregate({
            where: { templateId: templateIdInt, schoolId: schoolId, status: 'Success' },
            _sum: { amountPaid: true }
        });

        // Paid student count (distinct)
         const paidStudentCountResult = await prisma.feeRecord.groupBy({
             by: ['studentId'],
             where: { templateId: templateIdInt, schoolId: schoolId, status: "Paid" }
         });
        const paidStudentCount = paidStudentCountResult.length;

        const templateDetails = {
            name: template.name,
            totalAmountAssigned: stats._sum.amount || 0,
            assignedStudentCount: studentCount || 0,
            collectedAmount: collectionStats._sum.amountPaid || 0,
            paidStudentCount: paidStudentCount || 0
        };
        res.status(200).json(templateDetails);
    } catch (error) { console.error("Error in getTemplateDetails:", error); res.status(500).send("Server Error"); }
};

// 4. Get Late Payment Records
const getLatePayments = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let studentWhereClause = {};
        if (search) {
            studentWhereClause = {
                OR: [
                    { first_name: { contains: search, mode: 'insensitive' } },
                    { father_name: { contains: search, mode: 'insensitive' } },
                    { last_name: { contains: search, mode: 'insensitive' } },
                ]
            };
        }

        const query = {
            schoolId,
            status: 'Late',
            student: studentWhereClause // Search related student
        };

        const records = await prisma.feeRecord.findMany({
            where: query,
            include: {
                student: { // Populate
                    select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true } } }
                },
                template: { // Populate
                    select: { name: true }
                }
            },
            orderBy: { dueDate: 'asc' },
            take: parseInt(limit, 10),
            skip: skip
        });

        // Format data for frontend (to match Mongoose structure)
        const formattedRecords = records.map(r => ({
            ...r,
            studentId: { // Mongoose .populate('studentId', 'name class')
                ...r.student,
                name: getFullName(r.student),
                class: r.student.class.class_name,
            },
            templateId: r.template // Mongoose .populate('templateId', 'name')
        }));

        const totalDocuments = await prisma.feeRecord.count({ where: query });
        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
    } catch (error) { console.error("Error in getLatePayments:", error); res.status(500).send("Server Error"); }
};

// 5. Calculate Late Fees
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

        // Step 1: Mark 'Pending' records as 'Late'
        const result = await prisma.feeRecord.updateMany({
            where: {
                schoolId: schoolId,
                status: 'Pending',
                dueDate: { lt: today } // lt = less than
            },
            data: {
                status: 'Late',
                lateFine: LATE_FINE_AMOUNT,
            }
        });

        // Step 2: Update balanceDue for records that are 'Late'
        if (result.count > 0) {
            // Prisma doesn't support aggregate updates easily, raw SQL is safer
            await prisma.$executeRawUnsafe(
             `UPDATE "FeeRecord" 
              SET "balanceDue" = "amount" + "lateFine" - "amountPaid" 
              WHERE "schoolId" = $1 
              AND "status" = 'Late'
              AND "lateFine" = $2`, // Only update ones with the fine
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

// 6. Send Late Fee Reminders
const sendLateFeeReminders = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const lateRecords = await prisma.feeRecord.findMany({
            where: { schoolId, status: 'Late' },
            include: {
                student: { // Populate
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

            if (parentContact) {
                console.log(`Simulating: Sending SMS/Email reminder to parent (${parentContact}) for ${studentName} regarding late fee payment of ${amountDue}.`);
            } else {
                console.log(`Simulating: Cannot send reminder for ${studentName} - Parent contact missing.`);
            }
        });

        res.status(200).json({ message: `Successfully simulated sending reminders for ${lateRecords.length} late fee records.` });
    } catch (error) { console.error("Error in sendLateFeeReminders:", error); res.status(500).send("Server Error"); }
};

// 7. Get All Student Fee Records with Filters
const getStudentFeeRecords = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, studentName, studentId, status, classId, templateId, dueDateStart, dueDateEnd } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let query = { schoolId };

        if (status) {
            const statusArray = status.split(',').map(s => s.trim()).filter(s => s);
            if (statusArray.length > 0) {
                query.status = { in: statusArray };
            }
        }
        if (classId) query.classId = parseInt(classId); // Assuming classId is Int
        if (templateId) query.templateId = parseInt(templateId); // Assuming templateId is Int

        if (dueDateStart || dueDateEnd) {
            query.dueDate = {};
            if (dueDateStart) query.dueDate.gte = new Date(dueDateStart);
            if (dueDateEnd) query.dueDate.lte = new Date(dueDateEnd);
        }

        // Student ID (assuming 'studentId' in query is roll_number) or Name search
        if (studentId) {
            // If studentId (roll_number) is provided, it's a specific search
            query.student = {
                roll_number: { contains: studentId, mode: 'insensitive' },
                schoolId: schoolId
            };
        } else if (studentName) {
            // If no roll_number, search by name
            query.student = {
                schoolId: schoolId,
                OR: [
                    { first_name: { contains: studentName, mode: 'insensitive' } },
                    { father_name: { contains: studentName, mode: 'insensitive' } },
                    { last_name: { contains: studentName, mode: 'insensitive' } },
                ]
            };
        }

        const records = await prisma.feeRecord.findMany({
            where: query,
            include: {
                student: { select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true } }, roll_number: true } },
                template: { select: { name: true } }
            },
            orderBy: { id: 'desc' }, // Use 'id' or 'createdAt'
            take: parseInt(limit, 10),
            skip: skip
        });

        const formattedRecords = records.map(r => ({
            ...r,
            studentId: {
                ...r.student,
                name: getFullName(r.student),
                class: r.student?.class?.class_name,
                studentId: r.student?.roll_number, // Matching Mongoose 'studentId' string
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

// 8. Get Processing Payments
const getProcessingPayments = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let whereClause = { schoolId, status: 'Pending' };

        if (search) {
            whereClause.OR = [
                {
                    student: { // Student name search
                        OR: [
                            { first_name: { contains: search, mode: 'insensitive' } },
                            { father_name: { contains: search, mode: 'insensitive' } },
                            { last_name: { contains: search, mode: 'insensitive' } },
                        ]
                    }
                },
                { chequeNumber: { contains: search, mode: 'insensitive' } } // Cheque number search
            ];
        }

        const records = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                student: { select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true } } } },
                feeRecord: {
                    include: {
                        template: { select: { name: true } }
                    }
                }
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
            },
            templateName: r.feeRecord?.template?.name || 'N/A'
        }));

        const totalDocuments = await prisma.transaction.count({ where: whereClause });

        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
    } catch (error) { console.error("Error in getProcessingPayments:", error); res.status(500).send("Server Error"); }
};

// 9. Get Edited/Discounted Records
const getEditedRecords = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let studentWhereClause = {};
        if (search) {
            studentWhereClause = {
                OR: [
                    { first_name: { contains: search, mode: 'insensitive' } },
                    { father_name: { contains: search, mode: 'insensitive' } },
                    { last_name: { contains: search, mode: 'insensitive' } },
                ]
            };
        }

        const query = {
            schoolId,
            discount: { gt: 0 }, // gt = greater than
            student: studentWhereClause
        };

        const records = await prisma.feeRecord.findMany({
            where: query,
            include: {
                student: { select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true } } } },
                template: { select: { name: true } }
            },
            orderBy: { id: 'desc' }, // Use 'id' or 'updatedAt' if available
            take: parseInt(limit, 10),
            skip: skip
        });

        const formattedRecords = records.map(r => ({
            ...r,
            studentId: {
                ...r.student,
                name: getFullName(r.student),
                class: r.student?.class?.class_name,
            },
            templateId: r.template
        }));

        const totalDocuments = await prisma.feeRecord.count({ where: query });

        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
    } catch (error) { console.error("Error in getEditedRecords:", error); res.status(500).send("Server Error"); }
};

// 10. Get PDC Records
const getPdcRecords = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let whereClause = {
            schoolId,
            paymentMode: 'Cheque',
            status: 'Pending'
        };

        if (search) {
            whereClause.OR = [
                {
                    student: {
                        OR: [
                            { first_name: { contains: search, mode: 'insensitive' } },
                            { father_name: { contains: search, mode: 'insensitive' } },
                            { last_name: { contains: search, mode: 'insensitive' } },
                        ]
                    }
                },
                { chequeNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        const records = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                student: { select: { first_name: true, father_name: true, last_name: true, class: { select: { class_name: true } } } },
                feeRecord: {
                    include: {
                        template: { select: { name: true } }
                    }
                }
            },
            orderBy: { paymentDate: 'asc' },
            take: parseInt(limit, 10),
            skip: skip
        });

        const formattedRecords = records.map(r => ({
            ...r,
            studentId: {
                ...r.student,
                name: getFullName(r.student),
                class: r.student?.class?.class_name,
            },
            templateName: r.feeRecord?.template?.name || 'N/A'
        }));

        const totalDocuments = await prisma.transaction.count({ where: whereClause });

        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
    } catch (error) { console.error("Error in getPdcRecords:", error); res.status(500).send("Server Error"); }
};

// 11. Assign And Collect Fee
const assignAndCollectFee = async (req, res) => {
    // This function assumes Mongoose IDs are passed as strings and converts to Int
    // Ensure frontend sends Mongoose _id strings for studentId and templateId
    console.log("[assignAndCollectFee] Received request body:", req.body);
    const {
        studentId: studentMongoId, // Frontend sends Mongoose ID string
        templateId: templateMongoId, // Frontend sends Mongoose ID string
        dueDate,
        amountPaid,
        paymentMode,
        paymentDate,
        notes
    } = req.body;

    const schoolId = req.user.schoolId; // This is String (OK)
    const collectedByUserId = req.user.id; // This is Int (OK)

    // --- Find Prisma IDs based on Mongoose IDs ---
    // This is a temporary bridge. Ideally, frontend should send Prisma IDs.
    let studentIdInt, templateIdInt;
    try {
        const studentByMongo = await prisma.students.findFirst({ where: { mongoId: studentMongoId, schoolId } });
        const templateByMongo = await prisma.feeTemplate.findFirst({ where: { mongoId: templateMongoId, schoolId } });
        
        if (!studentByMongo) throw new Error(`Student with MongoID ${studentMongoId} not found.`);
        if (!templateByMongo) throw new Error(`Template with MongoID ${templateMongoId} not found.`);
        
        studentIdInt = studentByMongo.studentid; // Get Prisma Int ID
        templateIdInt = templateByMongo.id; // Get Prisma Int ID
    } catch (findError) {
         console.error("[assignAndCollectFee] Error finding Prisma IDs:", findError);
         return res.status(404).json({ message: `Student or Template not found. ${findError.message}`});
    }
    // --- End ID Bridge ---


    if (!studentIdInt || !templateIdInt || !dueDate) {
        return res.status(400).json({ message: 'Student ID, Template ID, and Due Date are required.' });
    }

    const numericAmountPaid = Number(amountPaid) || 0;
    const isPayingNow = numericAmountPaid > 0;

    if (isPayingNow && !paymentMode) return res.status(400).json({ message: 'Payment mode is required.' });
    if (isPayingNow && !paymentDate) return res.status(400).json({ message: 'Payment date is required.' });
    if (isPayingNow && paymentMode === 'Cheque' && (!notes || notes.trim() === '')) {
        return res.status(400).json({ message: 'Cheque number is required in notes.' });
    }

    const paymentDateObj = isPayingNow ? new Date(paymentDate) : new Date();
    
    console.log("[assignAndCollectFee] Prisma transaction starting.");
    
    let savedFeeRecord;
    let savedTransaction = null;
    let studentName, studentClassName, templateName;

    try {
        const result = await prisma.$transaction(async (tx) => {
            console.log(`[assignAndCollectFee] Fetching template: ${templateIdInt}, student: ${studentIdInt}`);
            
            const template = await tx.feeTemplate.findUnique({
                where: { id: templateIdInt, schoolId }
            });
            
            const student = await tx.students.findUnique({
                where: { studentid: studentIdInt, schoolId },
                include: { class: { select: { classid: true, class_name: true } } }
            });

            if (!template) throw new Error('Fee template not found.');
            if (!student || !student.class) throw new Error('Student not found or class not assigned.');
            
            const foundClassId = student.class.classid;
            studentClassName = student.class.class_name;
            studentName = getFullName(student);
            templateName = template.name;
            
            console.log(`[assignAndCollectFee] Found template: ${template.name}, student class: ${studentClassName} (ID: ${foundClassId})`);

            const existingRecord = await tx.feeRecord.findFirst({
                where: { studentId: studentIdInt, templateId: templateIdInt, schoolId }
            });
            if (existingRecord) {
                throw new Error('This fee template is already assigned to this student.');
            }

            const templateTotalAmount = template.totalAmount || 0;
            if (isPayingNow && numericAmountPaid > templateTotalAmount + 0.01) {
                throw new Error(`Amount paid (${numericAmountPaid}) cannot exceed template total (${templateTotalAmount}).`);
            }

            const balanceDue = templateTotalAmount - numericAmountPaid;
            const feeStatus = balanceDue <= 0.01 ? 'Paid' : (isPayingNow ? 'Partial' : 'Pending');

            savedFeeRecord = await tx.feeRecord.create({
                data: {
                    studentId: studentIdInt,
                    templateId: templateIdInt,
                    schoolId: schoolId,
                    classId: foundClassId,
                    amount: templateTotalAmount,
                    discount: 0,
                    amountPaid: numericAmountPaid,
                    balanceDue: balanceDue < 0 ? 0 : balanceDue,
                    status: feeStatus,
                    dueDate: new Date(dueDate),
                }
            });
            console.log(`[assignAndCollectFee] FeeRecord created: ${savedFeeRecord.id}, Status: ${feeStatus}`);

            if (isPayingNow) {
                const receiptId = `TXN-${Date.now()}`;
                const transactionStatus = (paymentMode === 'Cheque') ? 'Pending' : 'Success';

                savedTransaction = await tx.transaction.create({
                    data: {
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
                        notes,
                        chequeNumber: (paymentMode === 'Cheque') ? notes : null
                    }
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
                const populatedTransactionForEmit = {
                    ...result.savedTransaction,
                    studentName: studentName || 'N/A',
                    className: studentClassName || 'N/A',
                    templateName: templateName || 'N/A',
                    collectedByName: req.user?.name || 'Admin' 
                };
                io.emit('transaction_added', populatedTransactionForEmit);
                if (result.savedTransaction.status === 'Success') {
                    io.emit('new_transaction_feed', { name: studentName || 'A Student', amount: result.savedTransaction.amountPaid });
                }
            }
        } else { console.warn("[assignAndCollectFee] Socket.IO instance not found."); }

        const successMessage = isPayingNow 
            ? `Fee '${templateName}' assigned and payment of ${numericAmountPaid.toLocaleString('en-IN', {style:'currency', currency:'INR'})} recorded.`
            : `Fee '${templateName}' assigned successfully. Status: Pending.`;

        res.status(201).json({
            message: successMessage,
            feeRecord: result.savedFeeRecord,
            transaction: result.savedTransaction
        });

    } catch (error) {
        console.error('Error in assignAndCollectFee:', error);
        const statusCode = (error.message.includes('not found') || error.message.includes('already assigned')) ? 400 : 500;
        res.status(statusCode).json({ message: `Server error: ${error.message}` });
    }
};


// 12. Create a New Fee Template
const createFeeTemplate = async (req, res) => {
     try {
        const { name, description, items } = req.body;
        const schoolId = req.user.schoolId;

        if (!name || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Template name and at least one fee item are required.' });
        }
        if (!items.every(item => item && typeof item.name === 'string' && item.name.trim() !== '' && typeof item.amount === 'number' && item.amount >= 0)) {
             return res.status(400).json({ message: 'Each fee item must have a non-empty name and a non-negative amount.' });
        }

        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const trimmedName = name.trim();

        const existingTemplate = await prisma.feeTemplate.findUnique({ 
            where: { schoolId_name: { schoolId, name: trimmedName } } 
        });
        if (existingTemplate) {
            return res.status(400).json({ message: `A fee template with the name "${trimmedName}" already exists.` });
        }

        const newTemplate = await prisma.feeTemplate.create({
            data: { name: trimmedName, description, items, totalAmount, schoolId }
        });
        
        if (req.io) { req.io.emit('fee_template_added', newTemplate); }
        else { console.warn('Socket.IO instance not found.'); }
        
        res.status(201).json({ message: 'Fee Template created successfully!', template: newTemplate });
      } catch (error) { 
          console.error("Error in createFeeTemplate:", error); 
           if (error.code === 'P2002') {
               return res.status(400).json({ message: `A fee template with the name "${name.trim()}" already exists.` });
           }
          res.status(500).send("Server Error"); 
      }
};

// 12.5. Update Fee Template
const updateFeeTemplate = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    const templateIdInt = parseInt(req.params.id);
    const { name, description, items } = req.body;
    const schoolId = req.user.schoolId;

    if (isNaN(templateIdInt)) return res.status(400).json({ message: 'Invalid Template ID.' });
    if (!name || !items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Name and items array are required.' });

    let serverCalculatedTotal = 0;
    for (const item of items) {
         if (!item || typeof item.name !== 'string' || item.name.trim() === '' || typeof item.amount !== 'number' || item.amount < 0) {
             return res.status(400).json({ message: 'Each fee item must have a valid name and amount.' });
         }
         serverCalculatedTotal += item.amount;
    }

    try {
        const updatedTemplate = await prisma.feeTemplate.update({
            where: { id: templateIdInt, schoolId: schoolId },
            data: { name: name.trim(), description, items, totalAmount: serverCalculatedTotal }
        });
        
        if (req.io) { req.io.emit('fee_template_updated', updatedTemplate); }
        res.status(200).json({ message: 'Template updated successfully!', template: updatedTemplate });
    } catch (error) {
        console.error("Error in updateFeeTemplate:", error);
         if (error.code === 'P2025') return res.status(404).json({ message: 'Fee template not found or you do not have permission.' });
        res.status(500).json({ message: `Server error updating template: ${error.message}` });
    }
};

// 13. Delete Fee Template
const deleteFeeTemplate = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    const templateIdInt = parseInt(req.params.id);
    const schoolId = req.user.schoolId;

    if (isNaN(templateIdInt)) return res.status(400).json({ message: 'Invalid Template ID.' });

    try {
        const recordInUse = await prisma.feeRecord.findFirst({
            where: { templateId: templateIdInt, schoolId: schoolId }
        });
        if (recordInUse) return res.status(400).json({ message: 'Failed to delete template. It is already assigned.' });

        await prisma.feeTemplate.delete({ where: { id: templateIdInt, schoolId: schoolId } });

        if (req.io) { req.io.emit('fee_template_deleted', { id: templateIdInt }); }
        res.status(200).json({ message: 'Template deleted successfully!' });
    } catch (error) {
        console.error("Error in deleteFeeTemplate:", error);
        if (error.code === 'P2025') return res.status(404).json({ message: 'Fee template not found or you do not have permission.' });
        res.status(500).json({ message: `Server error deleting template: ${error.message}` });
    }
};

// 14. Get Sample Sheet
const getSampleSheet = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const sampleData = [
          { FeeRecordID_ToUpdate: 'Enter_Prisma_ID_Here (e.g., 12)', AmountPaid_Partially: 500, PaymentDate: 'YYYY-MM-DD', PaymentMode: 'Cash | Cheque | ...', Notes: 'Optional', ChequeNumber: 'If Cheque', BankName: 'If Cheque/NEFT...' },
        ];
        const wb = xlsx.utils.book_new(); const ws = xlsx.utils.json_to_sheet(sampleData);
        ws['!cols'] = [ { wch: 40 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 40 }, { wch: 25 }, { wch: 30 } ]; 
        xlsx.utils.book_append_sheet(wb, ws, "Fee Collection Import");
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="Sample_Fee_Collection_Import.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
      } catch (error) { console.error("Error generating sample sheet:", error); res.status(500).send("Server Error"); }
};

// 15. Update Existing Records (Import Fee Payments)
const updateExistingRecords = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No file uploaded.' });
    const schoolId = req.user.schoolId; const collectedByUserId = req.user.id;
    let workbook; try { workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true }); } catch (e) { return res.status(400).json({ message: 'Could not parse file.'}); }
    const sheetName = workbook.SheetNames[0]; if (!sheetName) return res.status(400).json({ message: 'No sheets found.' });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]); if (data.length === 0) return res.status(400).json({ message: 'Sheet is empty.' });
    let successCount = 0; let errorCount = 0; const errors = []; const updatedFeeRecordIds = new Set();
    for (const [index, row] of data.entries()) {
        const feeRecordIdInt = parseInt(row.FeeRecordID_ToUpdate); const amountPaidInput = row.AmountPaid_Partially; const paymentDateInput = row.PaymentDate;
        const mode = row.PaymentMode?.trim(); const notes = row.Notes; const chequeNumber = row.ChequeNumber; const bankName = row.BankName;
        if (isNaN(feeRecordIdInt)) { errorCount++; errors.push(`Row ${index+2}: Invalid ID.`); continue; }
        const amountPaid = Number(amountPaidInput); if (isNaN(amountPaid) || amountPaid <= 0) { errorCount++; errors.push(`Row ${index+2}: Invalid Amount.`); continue; }
        if (!mode) { errorCount++; errors.push(`Row ${index+2}: Missing Mode.`); continue; }
        const paymentDate = paymentDateInput instanceof Date ? paymentDateInput : new Date();
        try {
            await prisma.$transaction(async (tx) => {
                const feeRecord = await tx.feeRecord.findUnique({ where: { id: feeRecordIdInt, schoolId } });
                if (!feeRecord) throw new Error(`Record ${feeRecordIdInt} not found.`);
                if (amountPaid > feeRecord.balanceDue + 0.01) throw new Error(`Amount ${amountPaid} > balance ${feeRecord.balanceDue}.`);
                const transactionStatus = (mode === 'Cheque') ? 'Pending' : 'Success';
                await tx.transaction.create({ data: { feeRecordId: feeRecord.id, studentId: feeRecord.studentId, classId: feeRecord.classId, schoolId, templateId: feeRecord.templateId, amountPaid, paymentDate, paymentMode: mode, status: transactionStatus, collectedById: collectedByUserId, notes: notes || 'Imported', chequeNumber, bankName, receiptId: `TXN-${Date.now()}-${index}` } });
                if (transactionStatus === 'Success') {
                    const newAmountPaid = feeRecord.amountPaid + amountPaid; const newBalanceDue = feeRecord.balanceDue - amountPaid;
                    await tx.feeRecord.update({ where: { id: feeRecordIdInt }, data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue < 0 ? 0 : newBalanceDue, status: newBalanceDue <= 0.01 ? 'Paid' : 'Partial' } });
                    updatedFeeRecordIds.add(feeRecordIdInt.toString());
                }
            });
            successCount++;
        } catch (error) { errorCount++; errors.push(`Row ${index+2}: Error - ${error.message}`); console.error(`Error processing row ${index+2}:`, error); }
    }
    if (req.io && updatedFeeRecordIds.size > 0) { req.io.emit('updateDashboard'); req.io.emit('fee_records_updated'); }
    res.status(200).json({ message: `Import complete. ${successCount} recorded. ${errorCount} failed.`, errors });
};

// 16. Export Detail Report
const exportDetailReport = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const schoolId = req.user.schoolId; const filters = req.body || {}; let query = { schoolId };
        if (filters.status) query.status = filters.status; if (filters.paymentMode) query.paymentMode = filters.paymentMode;
        if (filters.classId) query.classId = parseInt(filters.classId);
        if (filters.startDate || filters.endDate) { /* ... date filter ... */ }
        if (filters.studentId) query.studentId = parseInt(filters.studentId);
        if (filters.templateId) query.templateId = parseInt(filters.templateId);
        const transactions = await prisma.transaction.findMany({ where: query, include: { student: { select: { first_name: true, father_name: true, last_name: true, roll_number: true, class: { select: { class_name: true }} } }, template: { select: { name: true } }, collectedBy: { select: { name: true } } }, orderBy: { paymentDate: 'desc' } });
        const dataForSheet = transactions.map(tx => ({ /* ... map data ... */ }));
        if (dataForSheet.length === 0) return res.status(404).json({ message: 'No transactions found.' });
        const wb = xlsx.utils.book_new(); const ws = xlsx.utils.json_to_sheet(dataForSheet);
        const columnWidths = [ /* ... widths ... */ ]; ws['!cols'] = columnWidths;
        xlsx.utils.book_append_sheet(wb, ws, "Detailed Fee Report"); const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="Detailed_Fee_Report.xlsx"'); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.send(buffer);
      } catch (error) { console.error("Error exporting detailed report:", error); res.status(500).send("Server Error"); }
};

// 17. Get Paid Transactions (for Student Tab)
const getPaidTransactions = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const studentIdInt = parseInt(req.params.studentId); const schoolId = req.user.schoolId;
        if (isNaN(studentIdInt)) return res.status(400).json({ message: 'Invalid Student ID.' });
        const allPaidTransactions = await prisma.transaction.findMany({ where: { schoolId, studentId: studentIdInt, status: 'Success' }, include: { template: { select: { name: true } }, feeRecord: { select: { isDeposit: true } } }, orderBy: { paymentDate: 'desc' } });
        const deposits = allPaidTransactions.filter(tx => tx.feeRecord?.isDeposit === true); const paidRecords = allPaidTransactions.filter(tx => !tx.feeRecord || tx.feeRecord?.isDeposit !== true);
        res.status(200).json({ deposits, paidRecords });
      } catch (error) { console.error("Error fetching paid transactions:", error); res.status(500).send("Server Error"); }
};

// 18. Get Failed Transactions (for Student Tab)
const getFailedTransactions = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const studentIdInt = parseInt(req.params.studentId); const schoolId = req.user.schoolId;
         if (isNaN(studentIdInt)) return res.status(400).json({ message: 'Invalid Student ID.' });
        const failedTransactions = await prisma.transaction.findMany({ where: { schoolId, studentId: studentIdInt, status: 'Failed' }, include: { template: { select: { name: true } } }, orderBy: { id: 'desc' } });
        res.status(200).json(failedTransactions);
      } catch (error) { console.error("Error fetching failed transactions:", error); res.status(500).send("Server Error"); }
};

// 19. Get Payment History (All transactions for Student Tab)
const getPaymentHistory = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const studentIdInt = parseInt(req.params.studentId); const schoolId = req.user.schoolId;
         if (isNaN(studentIdInt)) return res.status(400).json({ message: 'Invalid Student ID.' });
        const historyRecords = await prisma.transaction.findMany({ where: { schoolId, studentId: studentIdInt }, include: { template: { select: { name: true } } }, orderBy: { paymentDate: 'desc' } });
        res.status(200).json(historyRecords);
      } catch (error) { console.error("Error fetching payment history:", error); res.status(500).send("Server Error"); }
};

// 20. Collect Manual Fee
const collectManualFee = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    const { feeRecordId, amountPaid: amountPaidString, paymentMode, paymentDate, notes, chequeNumber, bankName } = req.body;
    const schoolId = req.user.schoolId; const collectedByUserId = req.user.id; const collectedByName = req.user.name || 'Admin';
    const feeRecordIdInt = parseInt(feeRecordId); if (isNaN(feeRecordIdInt)) return res.status(400).json({ msg: 'Invalid Fee Record ID.' });
    const amountPaid = Number(amountPaidString); if (isNaN(amountPaid) || amountPaid <= 0) return res.status(400).json({ msg: 'Invalid Amount.' });
    if (!paymentMode) return res.status(400).json({ msg: 'Payment Mode required.' }); if (paymentMode === 'Cheque' && !chequeNumber) return res.status(400).json({ msg: 'Cheque number required.' });
    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();
    let updatedFeeRecord; let newTransaction;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const feeRecord = await tx.feeRecord.findUnique({ where: { id: feeRecordIdInt, schoolId } }); if (!feeRecord) throw new Error('Record not found.');
            if (amountPaid > feeRecord.balanceDue + 0.01) throw new Error(`Amount ${amountPaid} > balance ${feeRecord.balanceDue}`);
            const receiptId = `TXN-${Date.now()}`; const transactionStatus = (paymentMode === 'Cheque') ? 'Pending' : 'Success';
            newTransaction = await tx.transaction.create({ data: { receiptId, feeRecordId: feeRecord.id, studentId: feeRecord.studentId, classId: feeRecord.classId, schoolId, templateId: feeRecord.templateId, amountPaid, paymentDate: paymentDateObj, paymentMode, status: transactionStatus, collectedById: collectedByUserId, notes, chequeNumber, bankName } });
            if (newTransaction.status === 'Success') {
                const newAmountPaid = feeRecord.amountPaid + amountPaid; const newBalanceDue = feeRecord.balanceDue - amountPaid;
                updatedFeeRecord = await tx.feeRecord.update({ where: { id: feeRecord.id }, data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue < 0 ? 0 : newBalanceDue, status: newBalanceDue < 0.01 ? 'Paid' : 'Partial' } });
            } else { updatedFeeRecord = feeRecord; }
            return { newTransaction, updatedFeeRecord };
        });
        console.log(`[Manual Collect] Committed.`);
        const studentInfo = await prisma.students.findUnique({ where: { studentid: result.updatedFeeRecord.studentId }, include: { class: { select: { class_name: true } } } });
        const templateInfo = await prisma.feeTemplate.findUnique({ where: { id: result.updatedFeeRecord.templateId } });
        const schoolInfo = await prisma.school.findUnique({ where: { id: schoolId } });
        const populatedTransaction = { ...result.newTransaction, studentName: getFullName(studentInfo) || 'N/A', className: studentInfo?.class?.class_name || 'N/A', templateName: templateInfo?.name || 'N/A', collectedBy: collectedByName, schoolInfo: { name: schoolInfo?.name, address: schoolInfo?.address, logo: schoolInfo?.logo } };
        if (req.io) { /* ... emit events ... */ }
        res.status(201).json({ message: 'Fee collected', transaction: populatedTransaction });
    } catch (error) { console.error('Error manual fee:', error); res.status(500).json({ msg: `Server error: ${error.message}` }); }
};

// 21. Get Single Transaction Details (Receipt)
const getTransactionById = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const transactionIdInt = parseInt(req.params.id); const schoolId = req.user.schoolId; if (isNaN(transactionIdInt)) return res.status(400).json({ message: 'Invalid ID' });
        const transaction = await prisma.transaction.findUnique({ where: { id: transactionIdInt, schoolId }, include: { student: { include: { class: { select: { class_name: true } } } }, template: { select: { name: true, items: true } }, collectedBy: { select: { name: true } } } });
        if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
        const feeRecord = await prisma.feeRecord.findUnique({ where: { id: transaction.feeRecordId }, select: { amount: true, discount: true, lateFine: true } });
        const schoolInfo = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true, address: true, logo: true, session: true } });
        const receiptData = { ...transaction, studentName: getFullName(transaction.student) || 'N/A', studentRegId: transaction.student?.roll_number || 'N/A', className: transaction.student?.class?.class_name || 'N/A', templateName: transaction.template?.name || 'N/A', templateItems: transaction.template?.items, collectedByName: transaction.collectedBy?.name || (transaction.paymentMode === 'Online' ? 'System' : 'N/A'), totalFeeAmount: feeRecord?.amount || 0, discountGiven: feeRecord?.discount || 0, lateFineApplied: feeRecord?.lateFine || 0, schoolInfo: { name: schoolInfo?.name, address: schoolInfo?.address, logo: schoolInfo?.logo, session: schoolInfo?.session } };
        delete receiptData.student; delete receiptData.template; delete receiptData.collectedBy;
        res.status(200).json(receiptData);
      } catch (error) { console.error("Error fetching transaction:", error); res.status(500).send("Server Error"); }
};

// 22. Get Class-wise Collection Report
const getClasswiseReport = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    try {
        const schoolId = req.user.schoolId;
        const classes = await prisma.classes.findMany({ where: { schoolId }, include: { _count: { select: { students: true } } }, orderBy: { class_name: 'asc' } });
        const reportData = await prisma.transaction.groupBy({ by: ['classId'], where: { schoolId: schoolId, status: 'Success' }, _sum: { amountPaid: true } });
        const report = classes.map(cls => { const collection = reportData.find(r => r.classId === cls.classid); return { classId: cls.classid, className: cls.class_name, totalCollection: collection?._sum.amountPaid || 0, studentCount: cls._count.students || 0 } });
        res.status(200).json(report);
      } catch (error) { console.error("Error fetching class-wise report:", error); res.status(500).send("Server Error"); }
};

// 23. Get Student-wise Report (by Class)
const getStudentReportByClass = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const schoolId = req.user.schoolId; const classIdInt = parseInt(req.params.classId); if (isNaN(classIdInt)) return res.status(400).json({ message: 'Invalid Class ID' });
        const students = await prisma.students.findMany({ where: { schoolId, classId: classIdInt }, orderBy: { first_name: 'asc' } });
        if (students.length === 0) return res.status(200).json([]);
        const studentIds = students.map(s => s.studentid);
        const paidData = await prisma.transaction.groupBy({ by: ['studentId'], where: { schoolId, classId: classIdInt, status: 'Success', studentId: { in: studentIds } }, _sum: { amountPaid: true } });
        const feeData = await prisma.feeRecord.groupBy({ by: ['studentId'], where: { schoolId, classId: classIdInt, studentId: { in: studentIds } }, _sum: { amount: true, discount: true, balanceDue: true } });
        const report = students.map(student => { const paid = paidData.find(p => p.studentId === student.studentid); const fee = feeData.find(f => f.studentId === student.studentid); return { studentId: student.studentid, studentName: getFullName(student), studentRegId: student.roll_number || 'N/A', totalPaid: paid?._sum.amountPaid || 0, totalDue: fee?._sum.amount || 0, totalDiscount: fee?._sum.discount || 0, totalBalance: fee?._sum.balanceDue || 0 } });
        res.status(200).json(report);
      } catch (error) { console.error("Error fetching student-wise report by class:", error); res.status(500).send("Server Error"); }
};

// ======================================================
// ===== FUNCTION TO UPDATE (Line 950 approx) =====
// ======================================================
// 24. Create Payment Order (Razorpay)
const createPaymentOrder = async (req, res) => {
     try {
        // --- FIX: Initialize Razorpay inside the function ---
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        // --- END FIX ---

        const { amount, feeRecordId } = req.body; // feeRecordId is String here
        const schoolId = req.user.schoolId;
        
        // --- FIX: Convert Mongoose ID string to Prisma Int ID ---
        let feeRecordIdInt;
        let feeRecord;
        try {
             // Find FeeRecord using Mongoose ID (mongoId) to get Prisma ID (id)
             const recordByMongo = await prisma.feeRecord.findFirst({
                 where: { mongoId: feeRecordId, schoolId }, // Assuming mongoId field
                 select: { id: true, studentId: true, classId: true, balanceDue: true }
             });
             if (!recordByMongo) {
                 return res.status(404).json({ message: 'Fee record not found (using mongoId).' });
             }
             feeRecordIdInt = recordByMongo.id; // This is the Prisma Int ID
             feeRecord = recordByMongo; // Use the fetched record
        } catch (findError) {
             console.error("[Create Order] Error finding fee record by mongoId:", findError);
             return res.status(500).json({ message: 'Error locating fee record.'});
        }
        // --- END FIX ---

        if (!amount || !feeRecordIdInt || Number(amount) <= 0) {
            return res.status(400).json({ message: "Valid Positive Amount and FeeRecordID are required" });
        }
        
        // const feeRecord = ... (This query is now done above)

         if (!feeRecord) { /* This check is redundant now */ }
         if (!feeRecord.studentId || !feeRecord.classId) {
             return res.status(404).json({ message: 'Fee record is missing student or class details.' });
         }
         if (Number(amount) > feeRecord.balanceDue + 0.01) { // Tolerance
              return res.status(400).json({ message: `Payment amount (${amount}) cannot exceed balance due (${feeRecord.balanceDue}).` });
         }

        const options = {
          amount: Math.round(Number(amount) * 100), // Paise
          currency: "INR",
          receipt: `rcpt_${feeRecordIdInt}_${Date.now()}`, // Use Prisma ID
          notes: { // Store Prisma IDs (Int) as strings for Razorpay
            feeRecordId: feeRecordIdInt.toString(),
            studentId: feeRecord.studentId.toString(),
            classId: feeRecord.classId.toString(),
            schoolId: schoolId.toString()
          }
        };

        console.log("[Razorpay] Creating order with options:", options);
        
        // --- FIX: Use the locally initialized razorpay instance ---
        const order = await razorpay.orders.create(options);
        // --- END FIX ---
        
        console.log("[Razorpay] Order created successfully:", order.id);
        res.status(200).json(order);

      } catch (error) {
        console.error("Error creating payment order:", error);
         const errorMessage = error.description || error.message || "Unknown error";
        res.status(500).json({ message: `Server Error: ${errorMessage}` });
      }
};

// 25. Verify Payment Webhook (Razorpay)
const verifyPaymentWebhook = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) { /* ... error */ }
    try { /* ... signature verification ... */ } catch(sigError) { /* ... error */ }
    const paymentEvent = req.body.event; const payment = req.body.payload?.payment?.entity;
     if (paymentEvent !== 'payment.captured' || !payment || payment.status !== 'captured') { /* ... ignore ... */ }
    const feeRecordIdInt = parseInt(payment.notes?.feeRecordId);
    const studentIdInt = parseInt(payment.notes?.studentId);
    const classIdInt = parseInt(payment.notes?.classId);
    const schoolId = payment.notes?.schoolId;
    if (!feeRecordIdInt || !studentIdInt || !classIdInt || !schoolId) { /* ... error */ }
    let updatedFeeRecord; let newTransaction;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const existingTransaction = await tx.transaction.findFirst({ where: { gatewayTransactionId: payment.id } });
            if (existingTransaction) throw new Error('Transaction already processed');
            const feeRecord = await tx.feeRecord.findUnique({ where: { id: feeRecordIdInt, schoolId } });
            if (!feeRecord) throw new Error(`FeeRecord ${feeRecordIdInt} not found.`);
            const amountPaid = Number(payment.amount) / 100; const receiptId = `TXN-${Date.now()}`;
            newTransaction = await tx.transaction.create({ data: { receiptId, feeRecordId: feeRecordIdInt, studentId: studentIdInt, classId: classIdInt, schoolId, templateId: feeRecord.templateId, amountPaid, paymentDate: new Date(payment.created_at * 1000), paymentMode: 'Online', status: 'Success', gatewayTransactionId: payment.id, gatewayOrderId: payment.orderid, gatewayMethod: payment.method, notes: `Online payment via ${payment.method}.` } });
            const newAmountPaid = feeRecord.amountPaid + amountPaid; const newBalanceDue = feeRecord.balanceDue - amountPaid;
            updatedFeeRecord = await tx.feeRecord.update({ where: { id: feeRecord.id }, data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue < 0 ? 0 : newBalanceDue, status: newBalanceDue < 0.01 ? 'Paid' : 'Partial' } });
            return { newTransaction, updatedFeeRecord };
        });
        console.log(`Webhook Success: Processed payment ${payment.id}.`);
        let studentName = 'A Student'; try { const student = await prisma.students.findUnique({ where: { studentid: studentIdInt }}); if (student) studentName = getFullName(student); } catch (e) { console.error("Webhook: Could not fetch student name:", e); }
         const populatedTransactionForEmit = { ...result.newTransaction, studentName: studentName };
        const io = req.app.get('socketio');
        if (io) { /* ... emit events ... */ } else { console.warn("Webhook Warning: Socket.IO instance not found."); }
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', payment?.id, error);
        if (error.message === 'Transaction already processed') return res.status(200).json({ message: 'Transaction already processed' });
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

// 26. Get Transactions (for History Tab)
const getTransactions = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 15, search = "", startDate, endDate, status, paymentMode, studentId } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        let queryConditions = { schoolId: schoolId };
        const studentIdInt = parseInt(studentId); if (studentIdInt) queryConditions.studentId = studentIdInt;
        if (startDate || endDate) { /* ... date filter ... */ }
        if (status) queryConditions.status = status; if (paymentMode) queryConditions.paymentMode = paymentMode;
        if (search && !studentIdInt) { queryConditions.OR = [ { student: { OR: [ { first_name: { contains: search, mode: 'insensitive' } }, { father_name: { contains: search, mode: 'insensitive' } }, { last_name: { contains: search, mode: 'insensitive' } } ] }}, { receiptId: { contains: search, mode: 'insensitive' } } ]; }
        else if (search && studentIdInt) { queryConditions.receiptId = { contains: search, mode: 'insensitive' }; }
        const totalDocuments = await prisma.transaction.count({ where: queryConditions });
        const transactions = await prisma.transaction.findMany({ where: queryConditions, include: { student: { select: { first_name: true, father_name: true, last_name: true, roll_number: true } }, template: { select: { name: true } }, collectedBy: { select: { name: true } } }, orderBy: { paymentDate: 'desc' }, take: parseInt(limit, 10), skip: skip });
        const formattedTransactions = transactions.map(tx => ({ ...tx, studentId: { name: getFullName(tx.student), studentId: tx.student?.roll_number }, templateName: tx.template?.name || 'N/A' }));
        res.status(200).json({ data: formattedTransactions, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10), totalRecords: totalDocuments });
    } catch (error) { console.error("Error in getTransactions:", error); res.status(500).send("Server Error fetching transactions"); }
};

// --- 3. EXPORTS (Same as before) ---
module.exports = {
  getDashboardOverview, getFeeTemplates, getTemplateDetails, getLatePayments, calculateLateFees, sendLateFeeReminders,
  getStudentFeeRecords, getProcessingPayments, getEditedRecords, getPdcRecords,
  assignAndCollectFee, // <-- Updated function name
  createFeeTemplate, updateFeeTemplate, deleteFeeTemplate,
  getSampleSheet, updateExistingRecords, exportDetailReport,
  getPaidTransactions, getFailedTransactions, getPaymentHistory,
  collectManualFee, getTransactionById, getClasswiseReport,
  getStudentReportByClass, createPaymentOrder, verifyPaymentWebhook,
  getTransactions,
  // Make sure assignFeeToStudent is NOT exported if replaced by assignAndCollectFee
  // assignFeeToStudent, // <-- Commented out / Removed
};
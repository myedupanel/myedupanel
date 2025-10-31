// backend/controllers/feeController.js
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
const FeeTemplate = require('../models/FeeTemplate');
const Transaction = require('../models/transaction'); // Make sure path is correct
const School = require('../models/School'); // <-- ADDED: Needed for school info in receipt
const User = require('../models/User'); // <-- ADDED: Needed for admin name in receipt
const Class = require('../models/Class'); // <-- ADDED: Class model import
const Razorpay = require('razorpay');

// --- FIX: Razorpay initialization ko yahaan se hata diya ---
// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// });
// --- END FIX ---

// 1. Get Dashboard Overview
const getDashboardOverview = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    try {
        const schoolId = req.user.schoolId; 
        const totalStudentCount = await Student.countDocuments({ schoolId: schoolId });
        const collectionStats = await Transaction.aggregate([
          { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), status: 'Success' } },
          { $group: { _id: null, totalCollection: { $sum: "$amountPaid" } } }
        ]);
        const feeStats = await FeeRecord.aggregate([
          { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
          { $group: {
              _id: null,
              lateFeeCollection: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, "$lateFine", 0] } },
              lateFeeStudentCount: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
              depositCollection: { $sum: { $cond: [{ $eq: ["$isDeposit", true] }, "$amount", 0] } },
              depositStudentCount: { $sum: { $cond: [{ $eq: ["$isDeposit", true] }, 1, 0] } }
            } }
        ]);
        const onlineTransactionCount = await Transaction.countDocuments({ schoolId: schoolId, paymentMode: 'Online', status: 'Success' });
        const overviewData = {
          lateCollection: { amount: feeStats[0]?.lateFeeCollection || 0, studentCount: feeStats[0]?.lateFeeStudentCount || 0 },
          onlinePayment: { transactionCount: onlineTransactionCount || 0, totalStudents: totalStudentCount || 0 },
          depositCollection: { amount: feeStats[0]?.depositCollection || 0, studentCount: feeStats[0]?.depositStudentCount || 0 },
          schoolCollection: { collected: collectionStats[0]?.totalCollection || 0, goal: 5000000 }
        };
        res.status(200).json(overviewData);
      } catch (error) { console.error("Error in getDashboardOverview:", error); res.status(500).send("Server Error"); }
};

// 2. Get All Fee Templates
const getFeeTemplates = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    try {
        const schoolId = req.user.schoolId;
        const templates = await FeeTemplate.find({ schoolId: schoolId }).select('name');
        res.status(200).json(templates || []);
      } catch (error) { console.error("Error in getFeeTemplates:", error); res.status(500).send("Server Error"); }
};

// 3. Get Single Template Details
const getTemplateDetails = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const schoolId = req.user.schoolId;
        const { id: templateId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(templateId)) return res.status(400).json({ msg: 'Invalid Template ID' });
        const template = await FeeTemplate.findOne({ _id: templateId, schoolId: schoolId });
        if (!template) return res.status(404).json({ msg: 'Template not found' });
        const stats = await FeeRecord.aggregate([
            { $match: { templateId: new mongoose.Types.ObjectId(templateId), schoolId: new mongoose.Types.ObjectId(schoolId) } },
            { $group: { _id: null, totalAmount: { $sum: "$amount" }, uniqueStudents: { $addToSet: "$studentId" } } },
            { $project: { _id: 0, totalAmount: 1, studentCount: { $size: "$uniqueStudents" } } }
        ]);
        const collectionStats = await Transaction.aggregate([
          { $match: { templateId: new mongoose.Types.ObjectId(templateId), schoolId: new mongoose.Types.ObjectId(schoolId), status: 'Success' } },
          { $group: { _id: null, collectedAmount: { $sum: "$amountPaid" } } }
        ]);
        const paidStudentCountResult = await FeeRecord.aggregate([
            { $match: { templateId: new mongoose.Types.ObjectId(templateId), schoolId: new mongoose.Types.ObjectId(schoolId), status: "Paid" } },
            { $group: { _id: "$studentId" } },
            { $count: "paidCount" }
        ]);
        const paidStudentCount = paidStudentCountResult[0]?.paidCount || 0;
        const templateDetails = {
          name: template.name, totalAmountAssigned: stats[0]?.totalAmount || 0, assignedStudentCount: stats[0]?.studentCount || 0,
          collectedAmount: collectionStats[0]?.collectedAmount || 0, paidStudentCount: paidStudentCount
        };
        res.status(200).json(templateDetails);
      } catch (error) { console.error("Error in getTemplateDetails:", error); res.status(500).send("Server Error"); }
};

// 4. Get Late Payment Records
const getLatePayments = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
      try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        let studentIdQuery = {};
        if (search) {
          const students = await Student.find({ schoolId, name: { $regex: search, $options: 'i' } }).select('_id');
          if (students.length === 0) return res.status(200).json({ data: [], totalPages: 0, currentPage: parseInt(page, 10) });
          studentIdQuery = { studentId: { $in: students.map(s => s._id) } };
        }
        const query = { schoolId, status: 'Late', ...studentIdQuery };
        const records = await FeeRecord.find(query).populate('studentId', 'name class').populate('templateId', 'name').sort({ dueDate: 1 }).limit(parseInt(limit, 10)).skip(skip);
        const totalDocuments = await FeeRecord.countDocuments(query);
        res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { console.error("Error in getLatePayments:", error); res.status(500).send("Server Error"); }
};

// 5. Calculate Late Fees
const calculateLateFees = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const schoolId = req.user.schoolId;
        const schoolSettings = await School.findById(schoolId).select('lateFineAmount');
        const LATE_FINE_AMOUNT = schoolSettings?.lateFineAmount || 100;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const result = await FeeRecord.updateMany(
          { schoolId: schoolId, status: 'Pending', dueDate: { $lt: today } },
          { $set: { status: 'Late', lateFine: LATE_FINE_AMOUNT } }
        );
        await FeeRecord.updateMany(
             { schoolId: schoolId, status: 'Late', lateFine: { $exists: true, $gt: 0 } },
             [ { $set: { balanceDue: { $add: ["$amount", "$lateFine", { $multiply: ["$amountPaid", -1] }] } } } ]
        );
        if (req.io && result.modifiedCount > 0) { req.io.emit('updateDashboard'); req.io.emit('fee_records_updated'); }
        res.status(200).json({ message: `${result.modifiedCount} records marked as 'Late' and fine applied.` });
      } catch (error) { console.error("Error in calculateLateFees:", error); res.status(500).send("Server Error"); }
};

// 6. Send Late Fee Reminders
const sendLateFeeReminders = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const schoolId = req.user.schoolId;
        const lateRecords = await FeeRecord.find({ schoolId, status: 'Late' }).populate('studentId', 'name parentContact');
        if (lateRecords.length === 0) return res.status(200).json({ message: 'No students with late fees to notify.' });
        lateRecords.forEach(record => {
            const studentName = record.studentId?.name || 'Your child';
            const parentContact = record.studentId?.parentContact;
            const amountDue = record.balanceDue;
            if (parentContact) { console.log(`Simulating: Sending SMS/Email reminder to parent (${parentContact}) for ${studentName} regarding late fee payment of ${amountDue}.`); }
            else { console.log(`Simulating: Cannot send reminder for ${studentName} - Parent contact missing.`); }
        });
        res.status(200).json({ message: `Successfully simulated sending reminders for ${lateRecords.length} late fee records.` });
      } catch (error) { console.error("Error in sendLateFeeReminders:", error); res.status(500).send("Server Error"); }
};

// 7. Get All Student Fee Records with Filters
const getStudentFeeRecords = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, studentName, studentId, status, classId, templateId, dueDateStart, dueDateEnd } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        let query = { schoolId };
        if (status) { const statusArray = status.split(',').map(s => s.trim()).filter(s => s); if (statusArray.length > 0) query.status = { $in: statusArray }; }
        if (classId && mongoose.Types.ObjectId.isValid(classId)) query.classId = new mongoose.Types.ObjectId(classId);
        if (templateId && mongoose.Types.ObjectId.isValid(templateId)) query.templateId = new mongoose.Types.ObjectId(templateId);
        if (dueDateStart || dueDateEnd) { query.dueDate = {}; if (dueDateStart) query.dueDate.$gte = new Date(dueDateStart); if (dueDateEnd) query.dueDate.$lte = new Date(dueDateEnd); }
        let studentQuery = { schoolId };
        if (studentName) studentQuery.name = { $regex: studentName, $options: 'i' };
        if (studentId) studentQuery.studentId = { $regex: studentId, $options: 'i' };
        if (studentName || studentId) {
          const students = await Student.find(studentQuery).select('_id');
          if (students.length === 0) return res.status(200).json({ data: [], totalPages: 0, currentPage: parseInt(page, 10) });
          query.studentId = { $in: students.map(s => s._id) };
        }
        const records = await FeeRecord.find(query).populate('studentId', 'name class studentId').populate('templateId', 'name').sort({ createdAt: -1 }).limit(parseInt(limit, 10)).skip(skip);
        const totalDocuments = await FeeRecord.countDocuments(query);
        res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { console.error("Error in getStudentFeeRecords:", error); res.status(500).send("Server Error"); }
};

// 8. Get Processing Payments
const getProcessingPayments = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        let studentIdQuery = {};
        if (search) {
           const students = await Student.find({ schoolId, name: { $regex: search, $options: 'i' } }).select('_id');
           const studentIds = students.map(s => s._id);
           studentIdQuery = { $or: [ { studentId: { $in: studentIds } }, { chequeNumber: { $regex: search, $options: 'i' } } ] };
        }
        const query = { schoolId, status: 'Pending', ...studentIdQuery };
        const records = await Transaction.find(query).populate('studentId', 'name class').populate({ path: 'feeRecordId', select: 'templateId', populate: { path: 'templateId', select: 'name' } }).sort({ createdAt: -1 }).limit(parseInt(limit, 10)).skip(skip);
        const formattedRecords = records.map(r => ({ ...r.toObject(), templateName: r.feeRecordId?.templateId?.name || 'N/A' }));
        const totalDocuments = await Transaction.countDocuments(query);
        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { console.error("Error in getProcessingPayments:", error); res.status(500).send("Server Error"); }
};

// 9. Get Edited/Discounted Records
const getEditedRecords = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        let studentIdQuery = {};
        if (search) {
          const students = await Student.find({ schoolId, name: { $regex: search, $options: 'i' } }).select('_id');
           if (students.length === 0) return res.status(200).json({ data: [], totalPages: 0, currentPage: parseInt(page, 10) });
          studentIdQuery = { studentId: { $in: students.map(s => s._id) } };
        }
        const query = { schoolId, discount: { $exists: true, $gt: 0 }, ...studentIdQuery };
        const records = await FeeRecord.find(query).populate('studentId', 'name class').populate('templateId', 'name').sort({ updatedAt: -1 }).limit(parseInt(limit, 10)).skip(skip);
        const totalDocuments = await FeeRecord.countDocuments(query);
        res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { console.error("Error in getEditedRecords:", error); res.status(500).send("Server Error"); }
};

// 10. Get PDC Records
const getPdcRecords = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        let studentOrChequeQuery = {};
        if (search) {
             const students = await Student.find({ schoolId, name: { $regex: search, $options: 'i' } }).select('_id');
             const studentIds = students.map(s => s._id);
             studentOrChequeQuery = { $or: [ { studentId: { $in: studentIds } }, { chequeNumber: { $regex: search, $options: 'i' } } ] };
        }
        const query = { schoolId, paymentMode: 'Cheque', status: 'Pending', ...studentOrChequeQuery };
        const records = await Transaction.find(query).populate('studentId', 'name class').populate({ path: 'feeRecordId', select: 'templateId', populate: { path: 'templateId', select: 'name' } }).sort({ paymentDate: 1 }).limit(parseInt(limit, 10)).skip(skip);
         const formattedRecords = records.map(r => ({ ...r.toObject(), templateName: r.feeRecordId?.templateId?.name || 'N/A' }));
        const totalDocuments = await Transaction.countDocuments(query);
        res.status(200).json({ data: formattedRecords, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
      } catch (error) { console.error("Error in getPdcRecords:", error); res.status(500).send("Server Error"); }
};

// 11. Assign Fee to Student
const assignFeeToStudent = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const { studentId, templateId, dueDate, discount = 0 } = req.body;
        const schoolId = req.user.schoolId;
        if (!studentId || !templateId || !dueDate) return res.status(400).json({ message: 'Student ID, Template ID, and Due Date are required.' });
        if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(templateId)) return res.status(400).json({ message: 'Invalid Student or Template ID format.' });
        const numericDiscount = Number(discount);
        if (isNaN(numericDiscount) || numericDiscount < 0) return res.status(400).json({ message: 'Discount must be a non-negative number.' });
        const template = await FeeTemplate.findOne({ _id: templateId, schoolId });
        if (!template) return res.status(404).json({ message: 'Fee template not found or does not belong to this school.' });
        const student = await Student.findOne({ _id: studentId, schoolId }).select('class');
         if (!student || !student.class) { console.error(`[Assign Fee] Failed Check: Student Found: ${!!student}, Class String: '${student?.class}' for student ID: ${studentId}`); return res.status(404).json({ message: 'Student not found or class (string) not assigned.' }); }
         const studentClassName = student.class;
         const classDoc = await Class.findOne({ name: studentClassName, schoolId: schoolId }).select('_id');
         if (!classDoc) { console.error(`[Assign Fee] Could not find Class document with name: '${studentClassName}' for school ${schoolId}`); return res.status(404).json({ message: `Class '${studentClassName}' not found in the database. Ensure class exists before assigning fees.` }); }
         const foundClassId = classDoc._id;
        const existingRecord = await FeeRecord.findOne({ studentId, templateId, schoolId });
        if (existingRecord) return res.status(400).json({ message: 'This fee template is already assigned to this student.' });
        const totalAmount = template.totalAmount;
        const finalDiscount = Math.min(numericDiscount, totalAmount);
        const balanceDue = totalAmount - finalDiscount;
        const newFeeRecord = new FeeRecord({
          studentId, templateId, schoolId, classId: foundClassId, amount: totalAmount, discount: finalDiscount, amountPaid: 0, balanceDue: balanceDue,
          status: balanceDue <= 0 ? 'Paid' : 'Pending', dueDate: new Date(dueDate),
        });
        await newFeeRecord.save();
        if (req.io) { req.io.emit('updateDashboard'); req.io.emit('fee_record_added', newFeeRecord); }
        res.status(201).json({ message: 'Fee assigned successfully!', record: newFeeRecord });
      } catch (error) {
          console.error("Error in assignFeeToStudent:", error);
          if (error.name === 'ValidationError') return res.status(400).json({ message: `Validation Error: ${error.message}` });
          if (error.message.includes('Class')) return res.status(500).json({ message: 'Error finding class details.' });
          res.status(500).send("Server Error");
      }
};

// 12. Create a New Fee Template
const createFeeTemplate = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const { name, description, items } = req.body;
        const schoolId = req.user.schoolId;
        if (!name || !items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Template name and at least one fee item (in items array) are required.' });
        if (!items.every(item => item && typeof item.name === 'string' && item.name.trim() !== '' && typeof item.amount === 'number' && item.amount >= 0)) return res.status(400).json({ message: 'Each fee item must have a non-empty name and a non-negative numeric amount.' });
        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const existingTemplate = await FeeTemplate.findOne({ name, schoolId });
        if (existingTemplate) return res.status(400).json({ message: `A fee template with the name "${name}" already exists.` });
        const newTemplate = new FeeTemplate({ name: name.trim(), description, items, totalAmount, schoolId });
        await newTemplate.save();
        if (req.io) { req.io.emit('fee_template_added', newTemplate); } else { console.warn('Socket.IO instance (req.io) not found...'); }
        res.status(201).json({ message: 'Fee Template created successfully!', template: newTemplate });
      } catch (error) { console.error("Error in createFeeTemplate:", error); if (error.name === 'ValidationError') return res.status(400).json({ message: `Validation Error: ${error.message}` }); res.status(500).send("Server Error"); }
};

// 13. Get Sample Sheet
const getSampleSheet = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const sampleData = [
          { FeeRecordID_ToUpdate: 'Enter_MongoDB_ID_Here...', AmountPaid_Partially: 500, PaymentDate: 'YYYY-MM-DD', PaymentMode: 'Cash | Cheque | ...', Notes: 'Optional', ChequeNumber: 'If Cheque', BankName: 'If Cheque/NEFT...' },
          { FeeRecordID_ToUpdate: 'Another_ID...', AmountPaid_Partially: 1000, PaymentDate: '2025-10-27', PaymentMode: 'Cheque', Notes: 'PDC', ChequeNumber: '123456', BankName: 'Example Bank' },
        ];
        const wb = xlsx.utils.book_new(); const ws = xlsx.utils.json_to_sheet(sampleData);
        ws['!cols'] = [ { wch: 40 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 40 }, { wch: 25 }, { wch: 30 } ];
        xlsx.utils.book_append_sheet(wb, ws, "Fee Collection Import"); const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="Sample_Fee_Collection_Import.xlsx"'); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.send(buffer);
      } catch (error) { console.error("Error generating sample sheet:", error); res.status(500).send("Server Error"); }
};

// 14. Update Existing Records (Import Fee Payments)
const updateExistingRecords = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No file uploaded or file is empty.' });
    const schoolId = req.user.schoolId; const collectedByUserId = req.user.id;
    let workbook; try { workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true }); } catch (e) { return res.status(400).json({ message: 'Could not parse file.'}); }
    const sheetName = workbook.SheetNames[0]; if (!sheetName) return res.status(400).json({ message: 'No sheets found.' });
    const worksheet = workbook.Sheets[sheetName]; const data = xlsx.utils.sheet_to_json(worksheet); if (data.length === 0) return res.status(400).json({ message: 'Sheet is empty.' });
    let successCount = 0; let errorCount = 0; const errors = []; const updatedFeeRecordIds = new Set();
    for (const [index, row] of data.entries()) {
        const feeRecordId = row.FeeRecordID_ToUpdate; const amountPaidInput = row.AmountPaid_Partially; const paymentDateInput = row.PaymentDate;
        const mode = row.PaymentMode?.trim(); const notes = row.Notes; const chequeNumber = row.ChequeNumber; const bankName = row.BankName;
        if (!feeRecordId || !mongoose.Types.ObjectId.isValid(feeRecordId)) { errorCount++; errors.push(`Row ${index+2}: Invalid ID.`); continue; }
        const amountPaid = Number(amountPaidInput); if (isNaN(amountPaid) || amountPaid <= 0) { errorCount++; errors.push(`Row ${index+2}: Invalid Amount.`); continue; }
        if (!mode) { errorCount++; errors.push(`Row ${index+2}: Missing Mode.`); continue; }
        const paymentDate = paymentDateInput instanceof Date ? paymentDateInput : new Date();
        const session = await mongoose.startSession(); session.startTransaction();
        try {
            const feeRecord = await FeeRecord.findOne({ _id: feeRecordId, schoolId }).session(session); if (!feeRecord) throw new Error(`Record ${feeRecordId} not found.`);
            if (amountPaid > feeRecord.balanceDue) throw new Error(`Amount ${amountPaid} > balance ${feeRecord.balanceDue}.`);
            const transactionStatus = (mode === 'Cheque') ? 'Pending' : 'Success';
            const newTransaction = new Transaction({ /* ... create transaction ... */ }); await newTransaction.save({ session });
            if (newTransaction.status === 'Success') { feeRecord.amountPaid += amountPaid; feeRecord.balanceDue -= amountPaid; feeRecord.status = feeRecord.balanceDue <= 0 ? 'Paid' : 'Partial'; await feeRecord.save({ session }); updatedFeeRecordIds.add(feeRecordId.toString()); }
            await session.commitTransaction(); successCount++;
        } catch (error) { await session.abortTransaction(); errorCount++; errors.push(`Row ${index+2}: Error - ${error.message}`); } finally { session.endSession(); }
    }
    if (req.io && updatedFeeRecordIds.size > 0) { req.io.emit('updateDashboard'); req.io.emit('fee_records_updated'); }
    res.status(200).json({ message: `Import complete. ${successCount} success, ${errorCount} failed.`, errors });
};

// 15. Export Detail Report
const exportDetailReport = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const schoolId = req.user.schoolId; const filters = req.body || {}; let query = { schoolId };
        if (filters.status) query.status = filters.status; if (filters.paymentMode) query.paymentMode = filters.paymentMode;
        if (filters.classId && mongoose.Types.ObjectId.isValid(filters.classId)) query.classId = new mongoose.Types.ObjectId(filters.classId);
        if (filters.startDate || filters.endDate) { /* ... date filter ... */ }
        if (filters.studentId && mongoose.Types.ObjectId.isValid(filters.studentId)) query.studentId = new mongoose.Types.ObjectId(filters.studentId);
        if (filters.templateId && mongoose.Types.ObjectId.isValid(filters.templateId)) query.templateId = new mongoose.Types.ObjectId(filters.templateId);
        const transactions = await Transaction.find(query).populate('studentId', 'name studentId').populate('classId', 'name').populate('templateId', 'name').populate('collectedBy', 'name').sort({ paymentDate: -1 });
        const dataForSheet = transactions.map(tx => ({ /* ... map data ... */ }));
        if (dataForSheet.length === 0) return res.status(404).json({ message: 'No transactions found.' });
        const wb = xlsx.utils.book_new(); const ws = xlsx.utils.json_to_sheet(dataForSheet);
        const columnWidths = [ /* ... widths ... */ ]; ws['!cols'] = columnWidths;
        xlsx.utils.book_append_sheet(wb, ws, "Detailed Fee Report"); const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="Detailed_Fee_Report.xlsx"'); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.send(buffer);
      } catch (error) { console.error("Error exporting detailed report:", error); res.status(500).send("Server Error"); }
};

// 16. Get Paid Transactions (for Student Tab)
const getPaidTransactions = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const { studentId } = req.params; const schoolId = req.user.schoolId; if (!mongoose.Types.ObjectId.isValid(studentId)) return res.status(400).json({ message: 'Invalid Student ID.' });
        const allPaidTransactions = await Transaction.find({ schoolId, studentId, status: 'Success' }).populate('templateId', 'name').populate({ path: 'feeRecordId', select: 'isDeposit' }).sort({ paymentDate: -1 });
        const deposits = allPaidTransactions.filter(tx => tx.feeRecordId?.isDeposit === true); const paidRecords = allPaidTransactions.filter(tx => !tx.feeRecordId || tx.feeRecordId?.isDeposit !== true);
        res.status(200).json({ deposits, paidRecords });
      } catch (error) { console.error("Error fetching paid transactions:", error); res.status(500).send("Server Error"); }
};

// 17. Get Failed Transactions (for Student Tab)
const getFailedTransactions = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const { studentId } = req.params; const schoolId = req.user.schoolId; if (!mongoose.Types.ObjectId.isValid(studentId)) return res.status(400).json({ message: 'Invalid Student ID.' });
        const failedTransactions = await Transaction.find({ schoolId, studentId, status: 'Failed' }).populate('templateId', 'name').sort({ createdAt: -1 });
        res.status(200).json(failedTransactions);
      } catch (error) { console.error("Error fetching failed transactions:", error); res.status(500).send("Server Error"); }
};

// 18. Get Payment History (All transactions for Student Tab)
const getPaymentHistory = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const { studentId } = req.params; const schoolId = req.user.schoolId; if (!mongoose.Types.ObjectId.isValid(studentId)) return res.status(400).json({ message: 'Invalid Student ID.' });
        const historyRecords = await Transaction.find({ schoolId, studentId }).populate('templateId', 'name').sort({ paymentDate: -1 });
        res.status(200).json(historyRecords);
      } catch (error) { console.error("Error fetching payment history:", error); res.status(500).send("Server Error"); }
};

// 19. Collect Manual Fee
const collectManualFee = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    const { feeRecordId, amountPaid: amountPaidString, paymentMode, paymentDate, notes, chequeNumber, bankName } = req.body;
    const schoolId = req.user.schoolId; const collectedByUserId = req.user.id; const collectedByName = req.user.name || 'Admin';
    if (!feeRecordId || !mongoose.Types.ObjectId.isValid(feeRecordId)) return res.status(400).json({ msg: 'Invalid Fee Record ID.' });
    const amountPaid = Number(amountPaidString); if (isNaN(amountPaid) || amountPaid <= 0) return res.status(400).json({ msg: 'Invalid Amount.' });
    if (!paymentMode) return res.status(400).json({ msg: 'Payment Mode required.' });
    if (paymentMode === 'Cheque' && !chequeNumber) return res.status(400).json({ msg: 'Cheque number required.' });
    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();
    const session = await mongoose.startSession(); session.startTransaction(); let updatedFeeRecord; let newTransaction;
    try {
        const feeRecord = await FeeRecord.findOne({ _id: feeRecordId, schoolId }).session(session); if (!feeRecord) throw new Error('Record not found.');
        if (amountPaid > feeRecord.balanceDue) throw new Error(`Amount exceeds balance.`);
        const receiptId = `TXN-${Date.now()}`; const transactionStatus = (paymentMode === 'Cheque') ? 'Pending' : 'Success';
        newTransaction = new Transaction({ receiptId, feeRecordId: feeRecord._id, studentId: feeRecord.studentId, classId: feeRecord.classId, schoolId, templateId: feeRecord.templateId, amountPaid, paymentDate: paymentDateObj, paymentMode, status: transactionStatus, collectedBy: collectedByUserId, notes, ...(paymentMode === 'Cheque' && { chequeNumber, bankName }) });
        await newTransaction.save({ session });
        if (newTransaction.status === 'Success') { feeRecord.amountPaid += amountPaid; feeRecord.balanceDue -= amountPaid; feeRecord.status = feeRecord.balanceDue < 0.01 ? 'Paid' : 'Partial'; if (feeRecord.balanceDue < 0) feeRecord.balanceDue = 0; updatedFeeRecord = await feeRecord.save({ session }); } else { updatedFeeRecord = feeRecord; }
        await session.commitTransaction();
        const studentInfo = await Student.findById(feeRecord.studentId).select('name class').lean(); const templateInfo = await FeeTemplate.findById(feeRecord.templateId).select('name').lean(); const schoolInfo = await School.findById(schoolId).select('name address logo').lean();
        const populatedTransaction = { ...newTransaction.toObject(), studentName: studentInfo?.name || 'N/A', className: studentInfo?.class || 'N/A', templateName: templateInfo?.name || 'N/A', collectedBy: collectedByName, schoolInfo: { name: schoolInfo?.name || 'School Name', address: schoolInfo?.address || 'School Address', logo: schoolInfo?.logo } };
        if (req.io) { /* ... emit events ... */ }
        res.status(201).json({ message: 'Fee collected', transaction: populatedTransaction });
    } catch (error) { await session.abortTransaction(); console.error('Error manual fee:', error); res.status(500).json({ msg: `Server error: ${error.message}` }); }
    finally { session.endSession(); }
};

// 20. Get Single Transaction Details (Receipt)
const getTransactionById = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const { id: transactionId } = req.params; const schoolId = req.user.schoolId; if (!mongoose.Types.ObjectId.isValid(transactionId)) return res.status(400).json({ message: 'Invalid Transaction ID' });
        const transaction = await Transaction.findOne({ _id: transactionId, schoolId: schoolId }).populate('studentId', 'name studentId class').populate('classId', 'name').populate('templateId', 'name items').populate('collectedBy', 'name').lean();
        if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
        const feeRecord = await FeeRecord.findById(transaction.feeRecordId).select('amount discount lateFine').lean();
        const schoolInfo = await School.findById(schoolId).select('name address logo session').lean();
        const receiptData = {
            ...transaction, studentName: transaction.studentId?.name || 'N/A', studentRegId: transaction.studentId?.studentId || 'N/A', className: transaction.studentId?.class || transaction.classId?.name || 'N/A',
            templateName: transaction.templateId?.name || 'N/A', collectedByName: transaction.collectedBy?.name || (transaction.paymentMode === 'Online' ? 'System (Online)' : 'N/A'),
            totalFeeAmount: feeRecord?.amount || 0, discountGiven: feeRecord?.discount || 0, lateFineApplied: feeRecord?.lateFine || 0,
            schoolInfo: { name: schoolInfo?.name || 'School Name', address: schoolInfo?.address || 'School Address', logo: schoolInfo?.logo, session: schoolInfo?.session || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` }
        };
        delete receiptData.studentId; delete receiptData.classId; delete receiptData.templateId; delete receiptData.collectedBy;
        res.status(200).json(receiptData);
      } catch (error) { console.error("Error fetching transaction for receipt:", error); res.status(500).send("Server Error"); }
};

// 21. Get Class-wise Collection Report
const getClasswiseReport = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
    try {
        const schoolId = req.user.schoolId;
        const report = await Transaction.aggregate([
          { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), status: 'Success' } },
          { $group: { _id: "$classId", totalCollection: { $sum: "$amountPaid" } } },
          { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'classDetails' } },
          { $unwind: { path: "$classDetails", preserveNullAndEmptyArrays: true } },
           { $lookup: { from: 'students', localField: '_id', foreignField: 'classId', pipeline: [ { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } }, { $count: 'count' } ], as: 'studentCountArr' } },
           { $unwind: { path: "$studentCountArr", preserveNullAndEmptyArrays: true } },
          { $project: { _id: 0, classId: "$_id", className: { $ifNull: ["$classDetails.name", "Unknown/Deleted Class"] }, totalCollection: "$totalCollection", studentCount: { $ifNull: ["$studentCountArr.count", 0] } } },
          { $sort: { className: 1 } }
        ]);
        res.status(200).json(report);
      } catch (error) { console.error("Error fetching class-wise report:", error); if (error.name === 'MongoNetworkError') { res.status(503).send("Database connection error"); } else { res.status(500).send("Server Error"); } }
};

// 22. Get Student-wise Report (by Class)
const getStudentReportByClass = async (req, res) => { /* ... (Poora function code waisa hi rahega) ... */
     try {
        const schoolId = req.user.schoolId; const { classId } = req.params; if (!mongoose.Types.ObjectId.isValid(classId)) return res.status(400).json({ message: 'Invalid Class ID' });
        const report = await Transaction.aggregate([
          { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), status: 'Success', classId: new mongoose.Types.ObjectId(classId) } },
          { $group: { _id: "$studentId", totalPaid: { $sum: "$amountPaid" } } },
          { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'studentDetails' } },
          { $unwind: { path: "$studentDetails", preserveNullAndEmptyArrays: true } },
           { $lookup: { from: 'feerecords', let: { student_id: "$_id" }, pipeline: [ { $match: { $expr: { $eq: ["$studentId", "$$student_id"] }, schoolId: new mongoose.Types.ObjectId(schoolId), classId: new mongoose.Types.ObjectId(classId) }}, { $group: { _id: null, totalDue: { $sum: "$amount" }, totalDiscount: { $sum: "$discount" }, totalBalance: { $sum: "$balanceDue" } }} ], as: 'feeSummary' } },
           { $unwind: { path: "$feeSummary", preserveNullAndEmptyArrays: true } },
          { $project: { _id: 0, studentId: "$_id", studentName: { $ifNull: ["$studentDetails.name", "Unknown/Deleted Student"] }, studentRegId: { $ifNull: ["$studentDetails.studentId", "N/A"] }, totalPaid: "$totalPaid", totalDue: { $ifNull: ["$feeSummary.totalDue", 0] }, totalDiscount: { $ifNull: ["$feeSummary.totalDiscount", 0] }, totalBalance: { $ifNull: ["$feeSummary.totalBalance", 0] } } },
          { $sort: { studentName: 1 } }
        ]);
        res.status(200).json(report);
      } catch (error) { console.error("Error fetching student-wise report by class:", error); if (error.name === 'MongoNetworkError') { res.status(503).send("Database connection error"); } else { res.status(500).send("Server Error"); } }
};

// 23. Create Payment Order (Razorpay)
const createPaymentOrder = async (req, res) => {
     try {
        // --- FIX: Initialize Razorpay inside the function ---
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        // --- END FIX ---

        const { amount, feeRecordId } = req.body;
        const schoolId = req.user.schoolId;
        if (!amount || !feeRecordId || Number(amount) <= 0 || !mongoose.Types.ObjectId.isValid(feeRecordId)) return res.status(400).json({ message: "Valid Positive Amount and FeeRecordID are required" });
        const feeRecord = await FeeRecord.findOne({ _id: feeRecordId, schoolId }).select('studentId classId balanceDue');
        if (!feeRecord) return res.status(404).json({ message: 'Fee record not found or does not belong to this school.' });
        if (!feeRecord.studentId || !feeRecord.classId) return res.status(404).json({ message: 'Fee record is missing student or class details.' });
        if (Number(amount) > feeRecord.balanceDue) return res.status(400).json({ message: `Payment amount (${amount}) cannot exceed balance due (${feeRecord.balanceDue}).` });
        const options = { amount: Math.round(Number(amount) * 100), currency: "INR", receipt: `rcpt_${feeRecordId}_${Date.now()}`, notes: { feeRecordId, studentId: feeRecord.studentId.toString(), classId: feeRecord.classId.toString(), schoolId: schoolId.toString() } };
        console.log("[Razorpay] Creating order with options:", options);
        const order = await razorpay.orders.create(options);
        if (!order || !order.id) { console.error("[Razorpay] Failed to create order. Response:", order); return res.status(500).json({ message: "Error creating Razorpay order. Please try again." }); }
        console.log("[Razorpay] Order created successfully:", order.id);
        res.status(200).json(order);
      } catch (error) { console.error("Error creating payment order:", error); const errorMessage = error.description || error.message || "Unknown error occurred"; res.status(500).json({ message: `Server Error creating payment order: ${errorMessage}` }); }
};

// 24. Verify Payment Webhook (Razorpay)
const verifyPaymentWebhook = async (req, res) => {
    const crypto = require('crypto');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) { console.error("FATAL: RAZORPAY_WEBHOOK_SECRET is not set..."); return res.status(200).json({ message: 'Webhook secret not configured on server.' }); }
    try {
        const shasum = crypto.createHmac('sha256', webhookSecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');
        if (digest !== req.headers['x-razorpay-signature']) { console.warn('Webhook Warning: Invalid signature received.'); return res.status(400).json({ message: 'Invalid signature' }); }
         console.log('Webhook Info: Signature verified successfully.');
    } catch(sigError) { console.error("Webhook Error: Error verifying webhook signature:", sigError); return res.status(400).json({ message: 'Signature verification failed.' }); }
    
    const paymentEvent = req.body.event; const payment = req.body.payload?.payment?.entity;
    console.log(`Webhook Info: Received event '${paymentEvent}'. Payment ID: ${payment?.id || 'N/A'}`);
    if (paymentEvent !== 'payment.captured' || !payment || payment.status !== 'captured') { console.log(`Webhook Info: Event '${paymentEvent}' ignored...`); return res.status(200).json({ status: 'ignored' }); }
    
    const { feeRecordId, studentId, classId, schoolId } = payment.notes || {};
    // --- FIX: Completed the validation check ---
    if (!feeRecordId || !studentId || !classId || !schoolId || 
        !mongoose.Types.ObjectId.isValid(feeRecordId) ||
        !mongoose.Types.ObjectId.isValid(studentId) ||
        !mongoose.Types.ObjectId.isValid(classId) ||
        !mongoose.Types.ObjectId.isValid(schoolId)
    ) {
    // --- END FIX ---
        console.error('Webhook Error: Missing or invalid required IDs in payment notes.', payment.notes);
        return res.status(200).json({ message: 'Missing/Invalid IDs in notes, cannot process payment record.' });
    } // <-- FIX: Added missing closing brace

    const session = await mongoose.startSession(); session.startTransaction(); let updatedFeeRecord;
    try {
        const existingTransaction = await Transaction.findOne({ gatewayTransactionId: payment.id }).session(session);
        if (existingTransaction) { console.log(`Webhook Info: Tx ${payment.id} already processed.`); await session.abortTransaction(); session.endSession(); return res.status(200).json({ message: 'Transaction already processed' }); }
        
        const feeRecord = await FeeRecord.findOne({ _id: feeRecordId, schoolId }).session(session);
        if (!feeRecord) throw new Error(`FeeRecord ${feeRecordId} not found...`);
        
        const amountPaid = Number(payment.amount) / 100; const receiptId = `TXN-${Date.now()}`;
        const newTransaction = new Transaction({
             receiptId, feeRecordId, studentId, classId, schoolId, templateId: feeRecord.templateId, amountPaid,
             paymentDate: new Date(payment.created_at * 1000), paymentMode: 'Online', status: 'Success',
             gatewayTransactionId: payment.id, gatewayOrderId: payment.order_id, gatewayMethod: payment.method,
             notes: `Online payment via ${payment.method}. Order: ${payment.order_id}. Payment: ${payment.id}.`
        });
        await newTransaction.save({ session });
        
        feeRecord.amountPaid += amountPaid; feeRecord.balanceDue -= amountPaid;
        feeRecord.status = feeRecord.balanceDue < 0.01 ? 'Paid' : 'Partial';
        if (feeRecord.balanceDue < 0) feeRecord.balanceDue = 0;
        updatedFeeRecord = await feeRecord.save({ session });
        
        await session.commitTransaction();
        console.log(`Webhook Success: Processed payment ${payment.id}. Updated FeeRecord ${feeRecordId}.`);
        
        let studentName = 'A Student'; try { const student = await Student.findById(studentId).select('name').lean(); if (student) studentName = student.name; } catch (e) { console.error("Webhook: Could not fetch student name..."); }
        const populatedTransactionForEmit = { ...newTransaction.toObject(), studentName };
        const io = req.app.get('socketio');
        if (io) {
             console.log("Webhook: Emitting Socket.IO events.");
             io.emit('updateDashboard');
             io.emit('fee_record_updated', updatedFeeRecord.toObject());
             io.emit('transaction_added', populatedTransactionForEmit);
             io.emit('new_transaction_feed', { name: studentName, amount: newTransaction.amountPaid });
        } else { console.warn("Webhook Warning: Socket.IO instance not found."); }
        
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        await session.abortTransaction();
        console.error('Webhook Error: Critical error processing payment:', payment?.id, error);
        if (error.message === 'Transaction already processed') return res.status(200).json({ message: 'Transaction already processed' }); // Handle re-thrown error
        res.status(500).json({ message: `Server error processing payment: ${error.message}` });
    } finally {
        session.endSession();
        console.log(`Webhook Info: Session ended for payment ${payment?.id || 'N/A'}`);
    }
};

// --- NEW FUNCTION for Transaction History/Search ---
const getTransactions = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { page = 1, limit = 15, search = "", startDate, endDate, status, paymentMode } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        let queryConditions = { schoolId: new mongoose.Types.ObjectId(schoolId) };
        if (startDate || endDate) { queryConditions.paymentDate={}; if(startDate) queryConditions.paymentDate.$gte=new Date(startDate); if(endDate){ const endOfDay=new Date(endDate); endOfDay.setHours(23,59,59,999); queryConditions.paymentDate.$lte=endOfDay;} }
        if (status) queryConditions.status = status;
        if (paymentMode) queryConditions.paymentMode = paymentMode;
        if (search) { const searchRegex = { $regex: search, $options: 'i' }; const matchingStudents = await Student.find({ schoolId, name: searchRegex }).select('_id'); const studentIds = matchingStudents.map(s => s._id); queryConditions.$or = [ { studentId: { $in: studentIds } }, { receiptId: searchRegex } ]; }
        const totalDocuments = await Transaction.countDocuments(queryConditions);
        const transactions = await Transaction.find(queryConditions)
            .populate('studentId', 'name studentId').populate('templateId', 'name').populate('collectedBy', 'name')
            .sort({ paymentDate: -1 }).limit(parseInt(limit, 10)).skip(skip).lean();
        const formattedTransactions = transactions.map(tx => ({ ...tx, templateName: tx.templateId?.name || 'N/A' }));
        res.status(200).json({ data: formattedTransactions, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10), totalRecords: totalDocuments });
    } catch (error) { console.error("Error in getTransactions:", error); res.status(500).send("Server Error fetching transactions"); }
};
// --- END NEW FUNCTION ---

// Export all controller functions
module.exports = {
  getDashboardOverview, getFeeTemplates, getTemplateDetails, getLatePayments, calculateLateFees, sendLateFeeReminders,
  getStudentFeeRecords, getProcessingPayments, getEditedRecords, getPdcRecords, assignFeeToStudent, createFeeTemplate,
  getSampleSheet, updateExistingRecords, exportDetailReport, getPaidTransactions, getFailedTransactions, getPaymentHistory,
  collectManualFee, getTransactionById, getClasswiseReport, getStudentReportByClass, createPaymentOrder, verifyPaymentWebhook,
  getTransactions
};
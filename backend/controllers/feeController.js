const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
const FeeTemplate = require('../models/FeeTemplate');


// 1. Get Dashboard Overview
const getDashboardOverview = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const totalStudentCount = await Student.countDocuments({ schoolId: schoolId });
    const feeStats = await FeeRecord.aggregate([
      { $match: { schoolId: schoolId } },
      { $group: { _id: null, totalCollection: { $sum: { $cond: [{ $eq: ["$status", "Paid"] }, "$amount", 0] } }, lateFeeCollection: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, "$lateFine", 0] } }, lateFeeStudentCount: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } }, depositCollection: { $sum: { $cond: [{ $eq: ["$isDeposit", true] }, "$amount", 0] } }, depositStudentCount: { $sum: { $cond: [{ $eq: ["$isDeposit", true] }, 1, 0] } } } }
    ]);
    const onlineTransactionCount = await FeeRecord.countDocuments({ schoolId: schoolId, paymentMode: 'Online' });
    const overviewData = {
      lateCollection: { amount: feeStats[0]?.lateFeeCollection || 0, studentCount: feeStats[0]?.lateFeeStudentCount || 0 },
      onlinePayment: { transactionCount: onlineTransactionCount || 0, totalStudents: totalStudentCount || 0 },
      depositCollection: { amount: feeStats[0]?.depositCollection || 0, studentCount: feeStats[0]?.depositStudentCount || 0 },
      schoolCollection: { collected: feeStats[0]?.totalCollection || 0, goal: 5000000 }
    };
    res.status(200).json(overviewData);
  } catch (error) { console.error("Error in getDashboardOverview:", error); res.status(500).send("Server Error"); }
};

// 2. Get All Fee Templates
const getFeeTemplates = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const templates = await FeeTemplate.find({ schoolId: schoolId }).select('name');
    res.status(200).json(templates || []);
  } catch (error) { console.error("Error in getFeeTemplates:", error); res.status(500).send("Server Error"); }
};

// 3. Get Single Template Details
const getTemplateDetails = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { id: templateId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(templateId)) return res.status(400).json({ msg: 'Invalid Template ID' });
    const template = await FeeTemplate.findOne({ _id: templateId, schoolId: schoolId });
    if (!template) return res.status(404).json({ msg: 'Template not found' });
    const stats = await FeeRecord.aggregate([
        { $match: { templateId: new mongoose.Types.ObjectId(templateId) } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" }, collectedAmount: { $sum: { $cond: [{ $eq: ["$status", "Paid"] }, "$amount", 0] } }, uniqueStudents: { $addToSet: "$studentId" } } },
        { $project: { _id: 0, totalAmount: 1, collectedAmount: 1, studentCount: { $size: "$uniqueStudents" } } }
    ]);
    const paidStudentCount = await FeeRecord.distinct("studentId", { templateId: new mongoose.Types.ObjectId(templateId), status: "Paid" }).countDocuments();
    const templateDetails = { name: template.name, ...stats[0], paidStudentCount: paidStudentCount || 0, studentCount: stats[0]?.studentCount || 0 };
    res.status(200).json(templateDetails);
  } catch (error) { console.error("Error in getTemplateDetails:", error); res.status(500).send("Server Error"); }
};

// 4. Get Late Payment Records
const getLatePayments = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const query = { schoolId, status: 'Late' };
    if (search) {
      const students = await Student.find({ schoolId, name: { $regex: search, $options: 'i' } }).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
    }
    const records = await FeeRecord.find(query).populate('studentId', 'name class').sort({ createdAt: -1 }).limit(parseInt(limit, 10)).skip(skip);
    const totalDocuments = await FeeRecord.countDocuments(query);
    res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
  } catch (error) { console.error("Error in getLatePayments:", error); res.status(500).send("Server Error"); }
};

// 5. Calculate Late Fees
const calculateLateFees = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const result = await FeeRecord.updateMany({ schoolId, status: 'Pending', dueDate: { $lt: new Date() } }, { $set: { status: 'Late', lateFine: 100 } });
    res.status(200).json({ message: `${result.modifiedCount} records updated to 'Late'.` });
  } catch (error) { console.error("Error in calculateLateFees:", error); res.status(500).send("Server Error"); }
};

// 6. Send Late Fee Reminders
const sendLateFeeReminders = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const lateRecords = await FeeRecord.find({ schoolId, status: 'Late' }).populate('studentId', 'name');
    if (lateRecords.length === 0) return res.status(200).json({ message: 'No students with late fees to notify.' });
    lateRecords.forEach(record => console.log(`Simulating: Sending reminder to ${record.studentId.name}...`));
    res.status(200).json({ message: `Successfully sent reminders to ${lateRecords.length} students.` });
  } catch (error) { console.error("Error in sendLateFeeReminders:", error); res.status(500).send("Server Error"); }
};

// 7. Get All Student Fee Records with Filters
const getStudentFeeRecords = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { page = 1, limit = 10, studentName, status } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const query = { schoolId };
    if (status) query.status = status;
    if (studentName) {
      const students = await Student.find({ schoolId, name: { $regex: studentName, $options: 'i' } }).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
    }
    const records = await FeeRecord.find(query).populate('studentId', 'name class').populate('templateId', 'name').sort({ createdAt: -1 }).limit(parseInt(limit, 10)).skip(skip);
    const totalDocuments = await FeeRecord.countDocuments(query);
    res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
  } catch (error) { console.error("Error in getStudentFeeRecords:", error); res.status(500).send("Server Error"); }
};

// 8. Get Processing/Failed Payments
const getProcessingPayments = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const query = { schoolId, status: 'Failed' };
    const records = await FeeRecord.find(query).populate('studentId', 'name class').populate('templateId', 'name').sort({ createdAt: -1 }).limit(parseInt(limit, 10)).skip(skip);
    const totalDocuments = await FeeRecord.countDocuments(query);
    res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
  } catch (error) { console.error("Error in getProcessingPayments:", error); res.status(500).send("Server Error"); }
};

// 9. Get Edited/Discounted Records
const getEditedRecords = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const query = { schoolId, discount: { $gt: 0 } };
    const records = await FeeRecord.find(query).populate('studentId', 'name class').populate('templateId', 'name').sort({ createdAt: -1 }).limit(parseInt(limit, 10)).skip(skip);
    const totalDocuments = await FeeRecord.countDocuments(query);
    res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
  } catch (error) { console.error("Error in getEditedRecords:", error); res.status(500).send("Server Error"); }
};

// 10. Get PDC Records
const getPdcRecords = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const query = { schoolId, paymentMode: 'Cheque', status: 'Pending' };
    const records = await FeeRecord.find(query).populate('studentId', 'name class').sort({ chequeDate: 1 }).limit(parseInt(limit, 10)).skip(skip);
    const totalDocuments = await FeeRecord.countDocuments(query);
    res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
  } catch (error) { console.error("Error in getPdcRecords:", error); res.status(500).send("Server Error"); }
};

// 11. Assign Fee to Student
const assignFeeToStudent = async (req, res) => {
  try {
    const { studentId, templateId, dueDate } = req.body;
    if (!studentId || !templateId || !dueDate) return res.status(400).json({ message: 'Student, template, and due date are required.' });
    const existingRecord = await FeeRecord.findOne({ studentId, templateId, schoolId: req.user.id });
    if (existingRecord) return res.status(400).json({ message: 'This fee template is already assigned to this student.' });
    const template = await FeeTemplate.findById(templateId);
    if (!template) return res.status(404).json({ message: 'Fee template not found.' });
    const newFeeRecord = new FeeRecord({ studentId, templateId, schoolId: req.user.id, amount: template.totalAmount, dueDate });
    await newFeeRecord.save();
    res.status(201).json({ message: 'Fee assigned successfully!', record: newFeeRecord });
  } catch (error) { console.error("Error in assignFeeToStudent:", error); res.status(500).send("Server Error"); }
};

// 12. Create a New Fee Template
const createFeeTemplate = async (req, res) => {
  try {
    const { name, description, items } = req.body;
    if (!name || !items || items.length === 0) return res.status(400).json({ message: 'Template name and at least one fee item are required.' });
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const newTemplate = new FeeTemplate({ name, description, items, totalAmount, schoolId: req.user.id });
    await newTemplate.save();
    res.status(201).json({ message: 'Fee Template created successfully!', template: newTemplate });
  } catch (error) { console.error("Error in createFeeTemplate:", error); res.status(500).send("Server Error"); }
};

const getSampleSheet = async (req, res) => {
  try {
    // 1. Sample data taiyaar karein (yeh columns banenge)
    const sampleData = [
      { StudentId: 'S001', Amount: 5000, PaymentDate: '25-12-2025' },
      { StudentId: 'S002', Amount: 4500, PaymentDate: '26-12-2025' },
    ];

    // 2. Excel workbook aur worksheet banayein
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(sampleData);
    xlsx.utils.book_append_sheet(wb, ws, "Fee Data");

    // 3. File ko buffer (memory) mein convert karein
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 4. Browser ko batayein ki yeh ek file hai jise download karna hai
    res.setHeader('Content-Disposition', 'attachment; filename="SampleFeeImport.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // 5. File ko response mein bhej dein
    res.send(buffer);

  } catch (error) {
    console.error("Error generating sample sheet:", error);
    res.status(500).send("Server Error");
  }
};

const updateExistingRecords = async (req, res) => {
  try {
    // 1. Check karein ki file upload hui hai ya nahi
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // 2. Uploaded file ko memory se padhein
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'The uploaded file is empty.' });
    }

    let updatedCount = 0;
    
    // 3. Har row ko loop karke record update karein
    for (const row of data) {
      const recordId = row.RecordId; // 'RecordId' column se ID nikalein
      
      // Agar row mein RecordId hai, tabhi aage badhein
      if (recordId && mongoose.Types.ObjectId.isValid(recordId)) {
        const updateData = {};
        if (row.Amount) updateData.amount = Number(row.Amount);
        if (row.Status && (row.Status.toLowerCase() === 'p' || row.Status.toLowerCase() === 'paid')) {
            updateData.status = 'Paid';
        }
        // Aap yahan aur bhi columns (jaise PaymentDate, etc.) add kar sakte hain

        await FeeRecord.findByIdAndUpdate(recordId, { $set: updateData });
        updatedCount++;
      }
    }

    res.status(200).json({ message: `Import complete. ${updatedCount} records were updated.` });

  } catch (error) {
    console.error("Error updating existing records:", error);
    res.status(500).send("Server Error");
  }
};
const exportDetailReport = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const filters = req.body; // Frontend se aaye filters

    const query = { schoolId };
    
    // Yahan hum filters ke aadhar par query banayenge (jaise status, date range, etc.)
    if(filters.status) query.status = filters.status;
    // (Baaki filters ke liye bhi logic add hogi)

    const records = await FeeRecord.find(query).populate('studentId', 'name class');

    // Excel file banane ka logic
    const dataForSheet = records.map(rec => ({
        StudentId: rec.studentId?.studentId || 'N/A',
        Name: rec.studentId?.name || 'N/A',
        Class: rec.studentId?.class || 'N/A',
        Amount: rec.amount,
        Status: rec.status,
        DueDate: new Date(rec.dueDate).toLocaleDateString('en-GB')
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(dataForSheet);
    xlsx.utils.book_append_sheet(wb, ws, "Fee Report");
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="FeeDetailReport.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).send("Server Error");
  }
};
const getPaidTransactions = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user.id;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required.' });
    }

    // Student ke sabhi 'Paid' records dhoondhein
    const allPaidRecords = await FeeRecord.find({
      schoolId: schoolId,
      studentId: studentId,
      status: 'Paid'
    }).populate('templateId', 'name').sort({ createdAt: -1 });

    // Records ko deposits aur normal paid records mein alag karein
    const deposits = allPaidRecords.filter(record => record.isDeposit === true);
    const paidRecords = allPaidRecords.filter(record => record.isDeposit === false);

    res.status(200).json({ deposits, paidRecords });

  } catch (error) {
    console.error("Error fetching paid transactions:", error);
    res.status(500).send("Server Error");
  }
};
const getFailedTransactions = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user.id;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required.' });
    }

    const failedRecords = await FeeRecord.find({
      schoolId: schoolId,
      studentId: studentId,
      status: 'Failed' // Sirf 'Failed' status waale records
    }).populate('templateId', 'name').sort({ createdAt: -1 });

    res.status(200).json(failedRecords);

  } catch (error) {
    console.error("Error fetching failed transactions:", error);
    res.status(500).send("Server Error");
  }
};
const getPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user.id;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required.' });
    }

    // Student ke sabhi records dhoondhein
    const historyRecords = await FeeRecord.find({
      schoolId: schoolId,
      studentId: studentId,
    })
    .populate('templateId', 'name')
    .sort({ createdAt: -1 }); // Sabse naye records upar

    res.status(200).json(historyRecords);

  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).send("Server Error");
  }
};
// Aakhir mein sabhi functions ko export karein
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
  assignFeeToStudent,
  createFeeTemplate,
  getSampleSheet,
  updateExistingRecords,
  exportDetailReport,
  getPaidTransactions,
  getFailedTransactions,
  getPaymentHistory
};
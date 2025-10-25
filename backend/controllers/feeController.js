const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
const FeeTemplate = require('../models/FeeTemplate');
const Transaction = require('../models/transaction'); // Yeh pehle se imported hai
const Razorpay = require('razorpay'); // Razorpay ko import karein
const crypto = require('crypto');

// Razorpay ko initialize karein (keys aapko Razorpay dashboard se milengi)
// Inhe .env file mein rakhein
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Get Dashboard Overview (UPDATED)
const getDashboardOverview = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const totalStudentCount = await Student.countDocuments({ schoolId: schoolId });
    
    // --- UPDATE: Total Collection ab 'Transaction' model se aayega ---
    const collectionStats = await Transaction.aggregate([
      { $match: { schoolId: schoolId, status: 'Success' } },
      { $group: { _id: null, totalCollection: { $sum: "$amountPaid" } } }
    ]);

    // Puraani stats query (Late fee aur Deposit ke liye)
    const feeStats = await FeeRecord.aggregate([
      { $match: { schoolId: schoolId } },
      { $group: { 
          _id: null, 
          lateFeeCollection: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, "$lateFine", 0] } }, 
          lateFeeStudentCount: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } }, 
          depositCollection: { $sum: { $cond: [{ $eq: ["$isDeposit", true] }, "$amount", 0] } }, 
          depositStudentCount: { $sum: { $cond: [{ $eq: ["$isDeposit", true] }, 1, 0] } } 
        } }
    ]);
    
    const onlineTransactionCount = await Transaction.countDocuments({ schoolId: schoolId, mode: 'Online', status: 'Success' });
    
    const overviewData = {
      lateCollection: { amount: feeStats[0]?.lateFeeCollection || 0, studentCount: feeStats[0]?.lateFeeStudentCount || 0 },
      onlinePayment: { transactionCount: onlineTransactionCount || 0, totalStudents: totalStudentCount || 0 },
      depositCollection: { amount: feeStats[0]?.depositCollection || 0, studentCount: feeStats[0]?.depositStudentCount || 0 },
      schoolCollection: { collected: collectionStats[0]?.totalCollection || 0, goal: 5000000 }
    };
    res.status(200).json(overviewData);
  } catch (error) { console.error("Error in getDashboardOverview:", error); res.status(500).send("Server Error"); }
};

// 2. Get All Fee Templates (No Change)
const getFeeTemplates = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const templates = await FeeTemplate.find({ schoolId: schoolId }).select('name');
    res.status(200).json(templates || []);
  } catch (error) { console.error("Error in getFeeTemplates:", error); res.status(500).send("Server Error"); }
};

// 3. Get Single Template Details (UPDATED)
const getTemplateDetails = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { id: templateId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(templateId)) return res.status(400).json({ msg: 'Invalid Template ID' });
    const template = await FeeTemplate.findOne({ _id: templateId, schoolId: schoolId });
    if (!template) return res.status(404).json({ msg: 'Template not found' });
    
    const stats = await FeeRecord.aggregate([
        { $match: { templateId: new mongoose.Types.ObjectId(templateId) } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" }, uniqueStudents: { $addToSet: "$studentId" } } },
        { $project: { _id: 0, totalAmount: 1, studentCount: { $size: "$uniqueStudents" } } }
    ]);

    const collectionStats = await Transaction.aggregate([
      { $match: { templateId: new mongoose.Types.ObjectId(templateId), status: 'Success' } },
      { $group: { _id: null, collectedAmount: { $sum: "$amountPaid" } } }
    ]);

    const paidStudentCount = await FeeRecord.distinct("studentId", { templateId: new mongoose.Types.ObjectId(templateId), status: "Paid" }).countDocuments();
    
    const templateDetails = { 
      name: template.name, 
      ...stats[0],
      collectedAmount: collectionStats[0]?.collectedAmount || 0, 
      paidStudentCount: paidStudentCount || 0, 
      studentCount: stats[0]?.studentCount || 0 
    };
    res.status(200).json(templateDetails);
  } catch (error) { console.error("Error in getTemplateDetails:", error); res.status(500).send("Server Error"); }
};

// 4. Get Late Payment Records (No Change)
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

// 5. Calculate Late Fees (No Change)
const calculateLateFees = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const result = await FeeRecord.updateMany({ schoolId, status: 'Pending', dueDate: { $lt: new Date() } }, { $set: { status: 'Late', lateFine: 100 } });
    
    if (req.io && result.modifiedCount > 0) {
        req.io.emit('updateDashboard');
        req.io.emit('fee_records_updated'); 
    }
    res.status(200).json({ message: `${result.modifiedCount} records updated to 'Late'.` });
  } catch (error) { console.error("Error in calculateLateFees:", error); res.status(500).send("Server Error"); }
};

// 6. Send Late Fee Reminders (No Change)
const sendLateFeeReminders = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const lateRecords = await FeeRecord.find({ schoolId, status: 'Late' }).populate('studentId', 'name');
    if (lateRecords.length === 0) return res.status(200).json({ message: 'No students with late fees to notify.' });
    lateRecords.forEach(record => console.log(`Simulating: Sending reminder to ${record.studentId.name}...`));
    res.status(200).json({ message: `Successfully sent reminders to ${lateRecords.length} students.` });
  } catch (error) { console.error("Error in sendLateFeeReminders:", error); res.status(500).send("Server Error"); }
};

// 7. Get All Student Fee Records with Filters (No Change)
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

// 8. Get Processing Payments (UPDATED)
const getProcessingPayments = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const query = { schoolId, status: 'Pending' }; 
    const records = await Transaction.find(query)
      .populate('studentId', 'name class')
      .populate('templateId', 'name') 
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip(skip);
    const totalDocuments = await Transaction.countDocuments(query);
    res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
  } catch (error) { console.error("Error in getProcessingPayments:", error); res.status(500).send("Server Error"); }
};

// 9. Get Edited/Discounted Records (No Change)
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

// 10. Get PDC Records (UPDATED)
const getPdcRecords = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const query = { schoolId, mode: 'Cheque', status: 'Pending' }; 
    const records = await Transaction.find(query)
      .populate('studentId', 'name class')
      .sort({ paymentDate: 1 }) 
      .limit(parseInt(limit, 10))
      .skip(skip);
    const totalDocuments = await Transaction.countDocuments(query);
    res.status(200).json({ data: records, totalPages: Math.ceil(totalDocuments / parseInt(limit, 10)), currentPage: parseInt(page, 10) });
  } catch (error) { console.error("Error in getPdcRecords:", error); res.status(500).send("Server Error"); }
};

// 11. Assign Fee to Student (No Change)
const assignFeeToStudent = async (req, res) => {
  try {
    const { studentId, templateId, dueDate } = req.body;
    if (!studentId || !templateId || !dueDate) return res.status(400).json({ message: 'Student, template, and due date are required.' });
    const existingRecord = await FeeRecord.findOne({ studentId, templateId, schoolId: req.user.id });
    if (existingRecord) return res.status(400).json({ message: 'This fee template is already assigned to this student.' });
    const template = await FeeTemplate.findById(templateId);
    if (!template) return res.status(404).json({ message: 'Fee template not found.' });
    
    const newFeeRecord = new FeeRecord({ 
      studentId, 
      templateId, 
      schoolId: req.user.id, 
      amount: template.totalAmount, 
      amountPaid: 0, 
      dueDate 
    });
    await newFeeRecord.save();

    if (req.io) {
        req.io.emit('updateDashboard');
        req.io.emit('fee_record_added', newFeeRecord); 
    }

    res.status(201).json({ message: 'Fee assigned successfully!', record: newFeeRecord });
  } catch (error) { console.error("Error in assignFeeToStudent:", error); res.status(500).send("Server Error"); }
};

// 12. Create a New Fee Template (No Change)
const createFeeTemplate = async (req, res) => {
  try {
    const { name, description, items } = req.body;
    if (!name || !items || items.length === 0) return res.status(400).json({ message: 'Template name and at least one fee item are required.' });
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const newTemplate = new FeeTemplate({ name, description, items, totalAmount, schoolId: req.user.id });
    await newTemplate.save();
    
    if (req.io) {
        req.io.emit('updateDashboard'); 
        req.io.emit('fee_template_added', newTemplate); 
    } else {
        console.warn('Socket.IO instance (req.io) not found on request object.');
    }

    res.status(201).json({ message: 'Fee Template created successfully!', template: newTemplate });
  } catch (error) { console.error("Error in createFeeTemplate:", error); res.status(500).send("Server Error"); }
};

// 13. Get Sample Sheet (No Change)
const getSampleSheet = async (req, res) => {
  try {
    const sampleData = [
      { StudentId: 'S001', Amount: 5000, PaymentDate: '25-12-2025' },
      { StudentId: 'S002', Amount: 4500, PaymentDate: '26-12-2025' },
    ];
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(sampleData);
    xlsx.utils.book_append_sheet(wb, ws, "Fee Data");
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="SampleFeeImport.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error("Error generating sample sheet:", error);
    res.status(500).send("Server Error");
  }
};

// 14. Update Existing Records (No Change)
const updateExistingRecords = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    if (data.length === 0) {
      return res.status(400).json({ message: 'The uploaded file is empty.' });
    }
    let updatedCount = 0;
    for (const row of data) {
      const recordId = row.RecordId; 
      if (recordId && mongoose.Types.ObjectId.isValid(recordId)) {
        const updateData = {};
        if (row.Amount) updateData.amount = Number(row.Amount);
        if (row.Status && (row.Status.toLowerCase() === 'p' || row.Status.toLowerCase() === 'paid')) {
            updateData.status = 'Paid';
        }
        await FeeRecord.findByIdAndUpdate(recordId, { $set: updateData });
        updatedCount++;
      }
    }
    if (req.io && updatedCount > 0) {
        req.io.emit('updateDashboard');
        req.io.emit('fee_records_updated'); 
    }
    res.status(200).json({ message: `Import complete. ${updatedCount} records were updated.` });
  } catch (error) {
    console.error("Error updating existing records:", error);
    res.status(500).send("Server Error");
  }
};

// 15. Export Detail Report (No Change)
const exportDetailReport = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const filters = req.body; 
    const query = { schoolId };
    if(filters.status) query.status = filters.status;
    const records = await FeeRecord.find(query).populate('studentId', 'name class');
    const dataForSheet = records.map(rec => ({
        StudentId: rec.studentId?.studentId || 'N/A',
        Name: rec.studentId?.name || 'N_A',
        Class: rec.studentId?.class || 'N_A',
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

// 16. Get Paid Transactions (UPDATED)
const getPaidTransactions = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user.id;
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required.' });
    }

    const allPaidTransactions = await Transaction.aggregate([
      { 
        $match: {
          schoolId: schoolId,
          studentId: new mongoose.Types.ObjectId(studentId),
          status: 'Success'
        }
      },
      {
        $lookup: {
          from: 'feerecords', 
          localField: 'feeRecordId',
          foreignField: '_id',
          as: 'feeRecordInfo'
        }
      },
      { $unwind: '$feeRecordInfo' },
      { $sort: { createdAt: -1 } }
    ]);
    
    const deposits = allPaidTransactions.filter(tx => tx.feeRecordInfo.isDeposit === true);
    const paidRecords = allPaidTransactions.filter(tx => tx.feeRecordInfo.isDeposit === false);

    res.status(200).json({ deposits, paidRecords });

  } catch (error) {
    console.error("Error fetching paid transactions:", error);
    res.status(500).send("Server Error");
  }
};

// 17. Get Failed Transactions (UPDATED)
const getFailedTransactions = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user.id;
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required.' });
    }

    const failedTransactions = await Transaction.find({
      schoolId: schoolId,
      studentId: studentId,
      status: 'Failed' 
    }).populate('templateId', 'name').sort({ createdAt: -1 });

    res.status(200).json(failedTransactions);

  } catch (error) {
    console.error("Error fetching failed transactions:", error);
    res.status(500).send("Server Error");
  }
};

// 18. Get Payment History (UPDATED)
const getPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user.id;
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required.' });
    }

    const historyRecords = await Transaction.find({
      schoolId: schoolId,
      studentId: studentId,
    })
    .populate('templateId', 'name')
    .sort({ createdAt: -1 }); 

    res.status(200).json(historyRecords);

  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).send("Server Error");
  }
};

// 19. Collect Manual Fee (UPDATED)
const collectManualFee = async (req, res) => {
  const { 
    feeRecordId, 
    studentId, 
    classId, 
    amountPaid, 
    mode, 
    paymentDate,
    notes 
  } = req.body;
  
  const schoolId = req.user.id; 
  const collectedByUserId = req.user.id;

  if (!feeRecordId || !studentId || !classId || !amountPaid || !mode || !schoolId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  let updatedFeeRecord; 

  try {
    const feeRecord = await FeeRecord.findById(feeRecordId).session(session);

    if (!feeRecord) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Fee Record not found' });
    }
    
    const currentBalance = feeRecord.amount - feeRecord.amountPaid - feeRecord.discount + feeRecord.lateFine;

    if (Number(amountPaid) > currentBalance) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: `Amount paid (${amountPaid}) exceeds balance due (${currentBalance})` 
      });
    }

    const newTransaction = new Transaction({
      feeRecordId: feeRecord._id,
      studentId: studentId,
      classId: classId, 
      schoolId: schoolId,
      templateId: feeRecord.templateId, 
      amountPaid: Number(amountPaid),
      paymentDate: paymentDate || new Date(),
      mode: mode,
      status: (mode === 'Cheque') ? 'Pending' : 'Success',
      collectedBy: collectedByUserId,
      notes: notes
    });
    
    await newTransaction.save({ session });

    if (newTransaction.status === 'Success') {
      feeRecord.amountPaid += newTransaction.amountPaid;
      updatedFeeRecord = await feeRecord.save({ session });
    } else {
      updatedFeeRecord = feeRecord; 
    }

    let studentName = 'A Student'; 
    try {
        const student = await Student.findById(studentId).session(session).select('name');
        if (student) {
            studentName = student.name;
        }
    } catch (nameError) {
        console.error("Could not fetch student name for live feed:", nameError);
    }

    await session.commitTransaction();
    session.endSession();
    
    if (req.io) {
        req.io.emit('updateDashboard');
        req.io.emit('fee_record_updated', updatedFeeRecord); 
        req.io.emit('transaction_added', newTransaction);
        
        if (newTransaction.status === 'Success') {
             req.io.emit('new_transaction_feed', { 
                name: studentName, 
                amount: newTransaction.amountPaid 
             });
        }
    }

    res.status(201).json({
      message: 'Fee collected successfully',
      transaction: newTransaction,
      updatedFeeRecord: updatedFeeRecord
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error collecting fee:', error);
    res.status(500).json({ message: 'Server error while collecting fee' });
  }
};

// 20. Get Single Transaction Details (Receipt)
exports.getTransactionById = async (req, res) => {
  try {
    const { id: transactionId } = req.params;
    const schoolId = req.user.id; 

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ message: 'Invalid Transaction ID' });
    }

    const transaction = await Transaction.findOne({ _id: transactionId, schoolId: schoolId })
      .populate('studentId', 'name class') 
      .populate('templateId', 'name'); 

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json(transaction);

  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).send("Server Error");
  }
};

// 21. Get Class-wise Collection Report
exports.getClasswiseReport = async (req, res) => {
  try {
    const schoolId = req.user.id;

    const report = await Transaction.aggregate([
      {
        $match: {
          schoolId: schoolId,
          status: 'Success'
        }
      },
      {
        $group: {
          _id: "$classId", 
          totalCollection: { $sum: "$amountPaid" }
        }
      },
      {
        $lookup: {
          from: 'classes', 
          localField: '_id',
          foreignField: '_id',
          as: 'classDetails'
        }
      },
      {
        $unwind: {
          path: "$classDetails",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          _id: 0, 
          classId: "$_id",
          className: "$classDetails.name", 
          totalCollection: "$totalCollection"
        }
      },
      {
        $sort: {
          totalCollection: -1
        }
      }
    ]);

    res.status(200).json(report);

  } catch (error) {
    console.error("Error fetching class-wise report:", error);
    res.status(500).send("Server Error");
  }
};

// 22. Get Student-wise Report (by Class)
exports.getStudentReportByClass = async (req, res) => {
  try {
    const schoolId = req.user.id;
    const { classId } = req.params; 

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid Class ID' });
    }

    const report = await Transaction.aggregate([
      {
        $match: {
          schoolId: schoolId,
          status: 'Success',
          classId: new mongoose.Types.ObjectId(classId)
        }
      },
      {
        $group: {
          _id: "$studentId", 
          totalPaid: { $sum: "$amountPaid" }
        }
      },
      {
        $lookup: {
          from: 'students', 
          localField: '_id',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      {
        $unwind: {
          path: "$studentDetails",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          _id: 0, 
          studentId: "$_id",
          studentName: "$studentDetails.name", 
          studentClass: "$studentDetails.class", 
          totalPaid: "$totalPaid"
        }
      },
      {
        $sort: {
          totalPaid: -1
        }
      }
    ]);

    res.status(200).json(report);

  } catch (error) {
    console.error("Error fetching student-wise report:", error);
    res.status(500).send("Server Error");
  }
};

// 23. Create Payment Order (Razorpay)
exports.createPaymentOrder = async (req, res) => {
  try {
    const { amount, feeRecordId, studentId, classId } = req.body;

    if (!amount || !feeRecordId || !studentId || !classId) {
        return res.status(400).json({ message: "Amount and fee details are required" });
    }

    const options = {
      amount: Number(amount) * 100, 
      currency: "INR",
      receipt: `receipt_fee_${feeRecordId}`, 
      notes: {
        feeRecordId: feeRecordId,
        studentId: studentId,
        classId: classId,
        schoolId: req.user.id
      }
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: "Error creating Razorpay order" });
    }

    res.status(200).json(order);

  } catch (error) {
    console.error("Error creating payment order:", error);
    res.status(500).send("Server Error");
  }
};
exports.verifyPaymentWebhook = async (req, res) => {
  // Yeh secret aapko Razorpay dashboard mein Webhook settings mein set karna hoga
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // 1. Razorpay se aaye signature ko verify karna (Security check)
  const shasum = crypto.createHmac('sha256', webhookSecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  // Agar signature match nahi hota, toh request ignore karein
  if (digest !== req.headers['x-razorpay-signature']) {
    console.warn('Invalid webhook signature received');
    return res.status(400).json({ message: 'Invalid signature' });
  }

  // Signature theek hai, ab payment data process karein
  const paymentEvent = req.body.event; // Event ka type (e.g., 'payment.captured')
  const payment = req.body.payload.payment.entity; // Payment ki details

  // 2. Sirf 'payment.captured' (successful payment) event ko hi process karein
  if (paymentEvent === 'payment.captured' && payment.status === 'captured') {
    
    // 3. 'notes' se hamari internal IDs nikaalein
    const { feeRecordId, studentId, classId, schoolId } = payment.notes;

    // Basic check ki notes mein IDs hain ya nahi
    if (!feeRecordId || !studentId || !classId || !schoolId) {
        console.error('Webhook Error: Missing required IDs in payment notes', payment.notes);
        // Razorpay ko success bhejein taaki woh dobara try na kare, lekin error log karein
        return res.status(200).json({ message: 'Missing IDs in notes, cannot process.' });
    }

    // 4. Database Transaction shuru karein
    const session = await mongoose.startSession();
    session.startTransaction();
    let updatedFeeRecord;

    try {
      // 5. Check karein ki yeh transaction pehle se save toh nahi ho gayi hai
      const existingTransaction = await Transaction.findOne({ gatewayTransactionId: payment.id }).session(session);
      if (existingTransaction) {
        await session.abortTransaction();
        session.endSession();
        console.log(`Webhook: Transaction ${payment.id} already processed.`);
        return res.status(200).json({ message: 'Transaction already processed' });
      }

      // 6. FeeRecord dhoondhein
      const feeRecord = await FeeRecord.findById(feeRecordId).session(session);
      if (!feeRecord) {
        await session.abortTransaction();
        session.endSession();
        console.error(`Webhook Error: FeeRecord not found with ID ${feeRecordId} for payment ${payment.id}`);
        // Success bhejein taaki Razorpay dobara try na kare
        return res.status(200).json({ message: 'Fee Record not found, cannot process.' });
      }

      // 7. Nayi 'Transaction' (pavati) banayein
      const newTransaction = new Transaction({
        feeRecordId: feeRecordId,
        studentId: studentId,
        classId: classId,
        schoolId: schoolId,
        templateId: feeRecord.templateId, // FeeRecord se templateId lein
        amountPaid: Number(payment.amount) / 100, // Paise to Rupees
        paymentDate: new Date(payment.created_at * 1000), // Unix timestamp to Date
        mode: 'Online',
        status: 'Success',
        gatewayTransactionId: payment.id, // Razorpay ki ID
        notes: `Online payment via ${payment.method}. Order ID: ${payment.order_id}`
        // collectedBy yahan null rahega
      });
      await newTransaction.save({ session });

      // 8. FeeRecord ko update karein
      feeRecord.amountPaid += newTransaction.amountPaid;
      updatedFeeRecord = await feeRecord.save({ session });
      
      // Real-time update ke liye student ka naam fetch karein
      let studentName = 'A Student';
      try {
          const student = await Student.findById(studentId).session(session).select('name');
          if (student) studentName = student.name;
      } catch (e) { console.error("Could not fetch student name for webhook feed"); }

      // 9. Transaction commit karein
      await session.commitTransaction();
      session.endSession();
      console.log(`Webhook: Successfully processed payment ${payment.id} for FeeRecord ${feeRecordId}`);

      // 10. Socket.io ko real-time updates bhejein
      const io = req.app.get('socketio'); 
      if (io) {
          io.emit('updateDashboard');
          io.emit('fee_record_updated', updatedFeeRecord); 
          io.emit('transaction_added', newTransaction);
          io.emit('new_transaction_feed', { 
              name: studentName, 
              amount: newTransaction.amountPaid 
          });
      }

      // 11. Razorpay ko success response bhejein (bahut zaroori)
      res.status(200).json({ status: 'ok' });

    } catch (error) {
      // Agar koi error aaye toh transaction revert karein
      await session.abortTransaction();
      session.endSession();
      console.error('Error processing webhook payment:', error);
      // Error response bhejein taaki Razorpay dobara try kare
      res.status(500).json({ message: 'Server error while processing payment' });
    }
  } else {
    // Agar event 'payment.captured' nahi hai, toh ignore karein
    res.status(200).send(`Event ${paymentEvent} received but not processed.`);
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
  getPaymentHistory,
  collectManualFee,
  getTransactionById,
  getClasswiseReport,
  getStudentReportByClass,
  createPaymentOrder,
  verifyPaymentWebhook
};
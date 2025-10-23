// backend/models/FeeRecord.js

const mongoose = require('mongoose');

const FeeRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Fee amount is required']
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Late', 'Failed'],
    default: 'Pending'
  },
  lateFine: {
    type: Number,
    default: 0
  },
  isDeposit: {
    type: Boolean,
    default: false
  },
  paymentMode: {
    type: String,
    enum: ['Online', 'Cash', 'Cheque', 'Bank Transfer'],
    required: false
  },
  // Yeh record kis student ka hai
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    // ===== YEH HAI ZAROORI BADLAAV =====
    ref: 'User', // Yeh Mongoose ko batata hai ki yeh ID 'User' model se judi hai
    required: true
  },
  // Yeh record kis school ka hai
  schoolId: {
    type: String,
    required: true
  },
  // Yeh record kis template se bana hai
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeTemplate', // Yeh 'FeeTemplate' model se juda hai
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  discount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  chequeNumber: { type: String, trim: true },
  chequeDate: { type: Date }, // Cheque par likhi hui date
  bankName: { type: String, trim: true },
  
  // --- Duplicate fields yahaan se hata diye gaye hain ---

});

module.exports = mongoose.model('FeeRecord', FeeRecordSchema);
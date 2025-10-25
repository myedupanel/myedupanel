const mongoose = require('mongoose');

const FeeRecordSchema = new mongoose.Schema({
  amount: { // Hum ise 'totalAmount' maan kar chalenge
    type: Number,
    required: [true, 'Fee amount is required']
  },
  
  // --- YEH HAIN NAYE FIELDS ---
  amountPaid: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    default: 0 // Hum ise controller mein calculate karke update karenge
  },
  // --- 
  
  status: {
    type: String,
    // 'Partial' ko yahan add kar diya hai
    enum: ['Paid', 'Pending', 'Late', 'Failed', 'Partial'], 
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
    ref: 'User', 
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
    ref: 'FeeTemplate', 
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
});

// Yeh hook 'balanceDue' ko save hone se pehle automatically calculate kar lega
FeeRecordSchema.pre('save', function(next) {
  this.balanceDue = this.amount - this.amountPaid - this.discount + this.lateFine;
  
  // Status ko bhi automatically update karega
  if (this.balanceDue <= 0) {
    this.status = 'Paid';
    this.balanceDue = 0; // Balance negative na jaaye
  } else if (this.amountPaid > 0) {
    this.status = 'Partial';
  } else {
    this.status = 'Pending'; 
    // Yahan aap 'Late' status ki logic bhi daal sakte hain
  }
  
  next();
});

module.exports = mongoose.model('FeeRecord', FeeRecordSchema);
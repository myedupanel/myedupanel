const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    // Yeh 'FeeRecord' se link karega
    feeRecordId: {
        type: Schema.Types.ObjectId,
        ref: 'FeeRecord', 
        required: true
    },
    // Yeh reporting ko fast karega
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    classId: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    
    // --- YEH HAIN NAYE FIELDS (REPORTING KE LIYE) ---
    schoolId: {
        type: String,
        required: true,
        index: true // Reporting queries ke liye index add karna accha hai
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'FeeTemplate',
        index: true // Reporting queries ke liye index add karna accha hai
    },
    // ---
    
    // Is transaction mein kitna amount mila
    amountPaid: {
        type: Number,
        required: true,
        default: 0
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    // Payment ka tareeka (Cash, Online, etc.)
    mode: {
        type: String,
        enum: ['Cash', 'Cheque', 'Draft', 'NEFT', 'RTGS', 'UPI', 'Online'],
        required: true
    },
    // Transaction ka status
    status: {
        type: String,
        enum: ['Success', 'Pending', 'Failed'],
        default: 'Success'
    },
    // Online payment ki unique ID
    gatewayTransactionId: {
        type: String,
        sparse: true // Yeh optional hai, isliye sparse
    },
    // Manual entry kisne ki (Admin/Staff)
    collectedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User' // Yahan aapka Admin/User model ka naam aayega
    },
    // --- NAYA FIELD (Notes/Remarks) ---
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true }); // timestamps add karne se `createdAt` aur `updatedAt` mil jayega

// Next.js/MERN stack me hot-reloading ke liye yeh best practice hai
module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
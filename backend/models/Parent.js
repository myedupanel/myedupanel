const mongoose = require('mongoose');

const ParentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  occupation: {
    type: String,
  },
  // Yeh hai sabse important part: Student se link
  studentId: {
    type: mongoose.Schema.Types.ObjectId, // Yeh Mongoose ko batata hai ki yahan kisi aur document ki ID store hogi
    ref: 'student',                       // Yeh batata hai ki ID 'students' collection se aayegi
    required: true,
  },
}, { timestamps: true }); // timestamps adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('parent', ParentSchema);
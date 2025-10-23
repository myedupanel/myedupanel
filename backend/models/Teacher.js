// models/Teacher.js

const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  // --- BADLAAV 1: 'schoolName' ko 'schoolId' se replace kiya ---
  schoolId: {
    type: mongoose.Schema.Types.ObjectId, // Yeh ek database ID hai
    ref: 'School', // Yeh 'School' model se link hai
    required: [true, "School ID is required for teacher"],
  },

  teacherId: {
    type: String,
    required: [true, "Teacher ID is required"]
  },
  name: {
    type: String,
    required: [true, "Teacher name is required"],
    trim: true
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, "Contact number is required"]
    // Consider adding phone number validation later
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true, // Email hamesha unique rahega (sahi hai)
    lowercase: true,
    trim: true,
    // Basic email format validation
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

// --- BADLAAV 2: Index ko 'schoolId' use karne ke liye update kiya ---
// Iska matlab hai ki teacherId ek schoolId ke andar unique hona chahiye.
TeacherSchema.index({ teacherId: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Teacher', TeacherSchema);
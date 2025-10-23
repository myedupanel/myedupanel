// models/Student.js

const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  // --- BADLAAV 1: 'schoolName' ko 'schoolId' se replace kiya ---
  schoolId: {
    type: mongoose.Schema.Types.ObjectId, // Yeh ek database ID hai
    ref: 'School', // Yeh 'School' model se link hai
    required: [true, "School ID is required for student"],
  },
  
  studentId: {
    type: String,
    required: [true, "Student ID is required"]
  },
  name: {
    type: String,
    required: [true, "Student name is required"],
    trim: true
  },
  class: {
    type: String,
    required: [true, "Student class is required"],
    trim: true
  },
  rollNo: {
    type: String,
    required: [true, "Student roll number is required"]
  },
  parentName: {
    type: String,
    required: [true, "Parent name is required"],
    trim: true
  },
  parentContact: {
    type: String,
    required: [true, "Parent contact is required"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

// --- BADLAAV 2: Index ko 'schoolId' use karne ke liye update kiya ---
// Iska matlab hai ki studentId ek schoolId ke andar unique hona chahiye.
StudentSchema.index({ studentId: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);
// models/Student.js

const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  // --- FIELD UPDATED ---
  schoolName: { // Changed from schoolId
    type: String, // Changed type to String
    required: [true, "School name is required for student"], // Added required message
    trim: true
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
    // Maybe add validation for phone number format later
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // You might want to add other fields like address, DOB, etc. later
});

// --- INDEX UPDATED ---
// This index ensures that within the same school (schoolName),
// each studentId must be unique.
StudentSchema.index({ studentId: 1, schoolName: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);
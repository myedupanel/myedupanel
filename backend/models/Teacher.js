// models/Teacher.js

const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  // --- FIELD UPDATED ---
  schoolName: { // Changed from schoolId
    type: String, // Changed type to String
    required: [true, "School name is required for teacher"], // Added required message
    trim: true
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
    unique: true, // Email should be unique across all users/teachers
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

// --- INDEX UPDATED ---
// This index ensures that within the same school (schoolName),
// each teacherId must be unique.
TeacherSchema.index({ teacherId: 1, schoolName: 1 }, { unique: true });

module.exports = mongoose.model('Teacher', TeacherSchema);
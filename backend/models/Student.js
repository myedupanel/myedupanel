// models/Student.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId, // Database ID
    ref: 'School', // Link to 'School' model
    required: [true, "School ID is required for student"],
    index: true // Add index for faster queries by school
  },
  // --- NEW: Link to the User model ---
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Link to 'User' model
    required: false, // Make it optional initially, can be set after User creation
    // Consider adding unique: true if one Student maps to exactly one User
  },
  // --- END NEW ---
  studentId: {
    type: String,
    required: [true, "Student ID is required"],
    trim: true // Added trim
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
    required: [true, "Student roll number is required"],
    trim: true // Added trim
  },
  parentName: {
    type: String,
    required: [true, "Parent name is required"],
    trim: true
  },
  parentContact: {
    type: String,
    required: [true, "Parent contact is required"],
    trim: true // Added trim
  },
  // --- NEW: Optional Email field ---
  email: {
    type: String,
    required: false, // Optional
    lowercase: true,
    trim: true,
    // No unique constraint here, uniqueness is enforced on the User model
    match: [/.+\@.+\..+/, 'Please fill a valid email address if provided']
  },
  // --- END NEW ---
  createdAt: {
    type: Date,
    default: Date.now
  },
});

// Index ensures studentId is unique within a schoolId
StudentSchema.index({ studentId: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);
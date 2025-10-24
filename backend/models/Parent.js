const mongoose = require('mongoose');

const ParentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // Added trim for consistency
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true // Added trim
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Added lowercase
    trim: true // Added trim
  },
  occupation: {
    type: String,
    trim: true // Added trim
  },
  // --- FIX: Changed 'ref' to match the Student model name ---
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student', // Changed from 'student'
    required: true,
  },
  // --- NEW: Add schoolId to associate Parent with a School ---
  schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, "School ID is required for parent"],
      index: true // Add index for faster queries by school
  },
  // --- END NEW ---

}, { timestamps: true }); // timestamps adds createdAt and updatedAt fields automatically

// Optional: Index for faster lookups within a school
ParentSchema.index({ email: 1, schoolId: 1 }, { unique: true }); // Ensure email is unique *within* a school

module.exports = mongoose.model('Parent', ParentSchema); // Register model as 'Parent'
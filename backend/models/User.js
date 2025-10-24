// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Import crypto library

const UserSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required for all users'],
  },
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },

  // --- EMAIL FIELD UPDATED ---
  email: {
    type: String,
    required: false, // <-- Changed to false
    unique: true,
    sparse: true, // <-- Added sparse index
    lowercase: true,
    trim: true, // Added trim for consistency
    // Optional: Keep basic format validation if an email IS provided
    match: [/.+\@.+\..+/, 'Please fill a valid email address if provided']
  },
  // --- END EMAIL UPDATE ---

  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'parent'],
    required: [true, 'User role is required'],
  },
  isVerified: {
    type: Boolean,
    default: false // Students might not need OTP verification initially
  },

  // Other fields (like tokens, otp) might be less relevant for students initially
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  otp: String,
  otpExpires: Date,
  schoolNameLastUpdated: Date, // Keep this for admin role
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing (No changes)
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new) AND not empty
  if (!this.isModified('password') || !this.password) {
      return next();
  }
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
  } catch (error) {
      next(error); // Pass error to the next middleware
  }
});


// Password reset token method (No changes)
UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // Set expiry to 10 minutes from now
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken; // Return the non-hashed token
};


module.exports = mongoose.model('User', UserSchema);
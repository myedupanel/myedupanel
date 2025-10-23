// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Import crypto library

const UserSchema = new mongoose.Schema({
  // --- BADLAAV 1: 'schoolName' ko 'schoolId' se replace kiya ---
  schoolId: {
    type: mongoose.Schema.Types.ObjectId, // Yeh ek database ID hai
    ref: 'School', // Yeh 'School' model se link hai
    required: [true, 'School ID is required for all users'],
  },

  // --- BADLAAV 2: 'adminName' ka naam badal kar 'name' kar diya ---
  name: { // Pehle 'adminName' tha
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // Email hamesha unique rahega
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'parent'],
    required: [true, 'User role is required'], // Ise 'default' se 'required' kar diya
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // --- Baaki ke fields ---
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  otp: String,
  otpExpires: Date,
  // --- BADLAAV 3: 'schoolNameLastUpdated' ko hata diya ---
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing function (isme koi badlav nahi)
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password reset token method (isme koi badlav nahi)
UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
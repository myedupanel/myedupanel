// backend/models/FeeTemplate.js

const mongoose = require('mongoose');

const feeItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const FeeTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // Is template ke andar kaun-kaun si fees hain
  // Jaise: [ { name: 'Tuition Fee', amount: 50000 }, { name: 'Library Fee', amount: 2000 } ]
  items: [feeItemSchema],
  
  totalAmount: {
    type: Number,
    required: true,
  },
  // Yeh template kis school ka hai
  schoolId: {
    type: String, // Hum ise req.user.id se link karenge
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FeeTemplate', FeeTemplateSchema);
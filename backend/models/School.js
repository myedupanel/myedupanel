// models/School.js

const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    // Basic Info
    name: {
        type: String,
        required: [true, "School name is required"],
        unique: true, // <-- YAHI HAI HAMAARA MAIN FIX!
        trim: true
    },
    
    // Location Info (Yeh aapka idea tha, bahut achha hai)
    location: {
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true }
    },

    // Platform Info (Yeh bhi perfect hai)
    plan: {
        type: String,
        enum: ['Starter', 'Premium', 'Trial'],
        default: 'Trial'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended'],
        default: 'Active'
    }
}, { 
    timestamps: true // 'createdAt' aur 'updatedAt' fields
});

// Yeh index location se search karne mein future mein madad karega
schoolSchema.index({ "location.city": 1, "location.state": 1 });

const School = mongoose.model('School', schoolSchema);

module.exports = School;
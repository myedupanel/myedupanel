const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    // Basic Info
    name: {
        type: String,
        required: true, // Yeh field zaroori hai
        trim: true      // Aage peeche ke extra spaces hata dega
    },
    adminName: {
        type: String,
        required: true
    },
    adminEmail: {
        type: String,
        required: true,
        unique: true    // Har school ka admin email alag hona chahiye
    },
    
    // Location Info (Problem #2 ko solve karne ke liye)
    location: {
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true }
    },

    // Platform Info
    plan: {
        type: String,
        enum: ['Starter', 'Premium', 'Trial'], // Inke alawa koi aur value nahi ho sakti
        default: 'Trial'                     // Naya school banne par default value
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended'],
        default: 'Active'
    }
}, { 
    timestamps: true // 'createdAt' aur 'updatedAt' fields apne aap ban jayengi
});

const School = mongoose.model('School', schoolSchema);

module.exports = School;
// File: backend/middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');

// 1. General Rate Limiter (For most API endpoints)
// 15 minutes mein 100 requests ki limit.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        msg: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. Auth Limiter (Brute Force protection for Login/Signup)
// 5 minutes mein sirf 5 attempts. Agar koi fail karta hai toh 5 minute ka block.
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        msg: 'Too many failed login attempts. Please try again after 5 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => {
        // SuperAdmin IP ko skip kar sakte hain agar zaroori ho,
        // ya sirf login/signup routes ko target karein.
        return false; 
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
};
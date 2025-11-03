// File: backend/config/prisma.js (FIXED)

const { PrismaClient } = require('@prisma/client');

// 1. Prisma client ko global object se link karne ke liye ek alag object banao.
const globalForPrisma = global; 

// 2. Hum hamesha 'globalForPrisma.prisma' se hi client lenge, agar exist karta hai.
//    Agar nahi karta, toh naya client banayenge.
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'], // Optional: Add logging for better debugging
});

// 3. Development/Testing mein, naye client ko global object mein save kar do.
//    Production mein, aisa karne ki zaroorat nahi hai.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 4. Ab hum hamesha yeh reliably defined 'prisma' object export karenge.
module.exports = prisma;
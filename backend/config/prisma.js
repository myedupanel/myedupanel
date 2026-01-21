// File: backend/config/prisma.js
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  // In production, create a single instance
  prisma = new PrismaClient();
} else {
  // In development, use global instance to prevent hot reloading issues
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;
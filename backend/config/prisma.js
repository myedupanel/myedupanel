// File: backend/config/prisma.js
// Use Prisma client from the root directory to avoid duplicate installations
const { PrismaClient } = require('../../node_modules/@prisma/client');

let prisma;
 
if (process.env.NODE_ENV === 'production') {
<<<<<<< HEAD
  // In production, create a single instance
  prisma = new PrismaClient();
=======
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
>>>>>>> 1111f0618edff54adadf0e97c6ded36c47715662
} else {
  // In development, use global instance to prevent hot reloading issues
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;
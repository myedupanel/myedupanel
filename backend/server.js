// backend/server.js

require('dotenv').config(); // Environment variables load karein
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

// --- Route Imports (Same) ---
// In routes mein ab Mongoose ke bajaye Prisma use hoga
const academicRoutes = require('./routes/academics');
const eventRoutes = require('./routes/events');
const settingRoutes = require('./routes/settings');
const liveClassRoutes = require('./routes/liveClasses');
const studyMaterialRoutes = require('./routes/studyMaterial');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const parentRoutes = require('./routes/parents');
const schoolRoutes = require('./routes/schoolRoutes');
const feeRoutes = require('./routes/fees');
const staffRoutes = require('./routes/staff');
const quizRoutes = require('./routes/quiz');
const analyticsRoutes = require('./routes/analytics');
const classRoutes = require('./routes/classes');
// const dashboardRoutes = require('./routes/dashboard'); // Agar use karna hai toh uncomment karein

// --- Express App Setup ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Standard Middlewares (Same) ---
app.use(cors());
app.use(express.json());

// --- Debugging Middleware (Same) ---
app.use((req, res, next) => {
  console.log(`--> Request Received: ${req.method} ${req.originalUrl}`);
  next();
});

// --- HTTP Server and Socket.IO Setup (Same) ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Attach io instance to app object (Same)
app.set('socketio', io);

// Middleware to attach 'io' to every request (Same)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- Register API Routes (Same) ---
app.get('/', (req, res) => {
  res.send('SchoolPro Backend is running (Prisma Version)!'); // Message update kar diya
});

// Saare routes register karein (Same)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/academics', academicRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/study-material', studyMaterialRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/classes', classRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// --- Socket.IO Connection Handler (Same) ---
io.on('connection', (socket) => {
  console.log('A user connected via Socket.IO:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected via Socket.IO:', socket.id);
  });
});

// --- Start Server (Simplified) ---
// Prisma apna connection khud manage karta hai, isliye mongoose.connect() ki zaroorat nahi.
server.listen(PORT, '0.0.0.0', () => { // Render ke liye '0.0.0.0' par listen karein
  console.log(`Server (Prisma Version) is running on port: ${PORT}`);
});
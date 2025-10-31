// backend/server.js

require('dotenv').config(); // Environment variables load karein
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

// --- Allowed URLs ki list (No Change) ---
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000", 
  "http://localhost:3000",
  "https://myedupanel.vercel.app" 
];
// --- END ---


// --- Route Imports (No Change) ---
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
const schoolRoutes = require('./routes/schoolRoutes'); // <-- School route
const feeRoutes = require('./routes/fees');
const staffRoutes = require('./routes/staff');
const quizRoutes = require('./routes/quiz');
const analyticsRoutes = require('./routes/analytics');
const classRoutes = require('./routes/classes');
// const dashboardRoutes = require('./routes/dashboard'); 

// --- Express App Setup (No Change) ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Standard Middlewares (Updated) ---
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
// --- END ---

// --- Debugging Middleware (No Change) ---
app.use((req, res, next) => {
  console.log(`--> Request Received: ${req.method} ${req.originalUrl}`);
  next();
});

// --- HTTP Server and Socket.IO Setup (No Change) ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set('socketio', io);
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- Register API Routes (ORDER IS UPDATED) ---
app.get('/', (req, res) => {
  res.send('SchoolPro Backend is running (Prisma Version)!'); 
});


// --- YEH HAI AAPKA FIX ---
// KADAM 1: File-upload (multer) waale route ko JSON parser se PEHLE rakhein
// Taaki 'multipart/form-data' request corrupt na ho
app.use('/api/school', schoolRoutes); 

// KADAM 2: Ab global JSON parser ko add karein (aapki 800kb waali request ke liye limit badha di hai)
// Yeh baaki sabhi routes (login, add student, etc.) ke liye zaroori hai
// Humne limit ko 2mb kar diya hai taaki 800kb se badi JSON request bhi pass ho sake.
app.use(express.json({ limit: '2mb' })); 
// --- FIX ENDS HERE ---


// KADAM 3: Baaki saare routes (jo JSON expect karte hain)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
// app.use('/api/school', schoolRoutes); // <-- Yeh line upar (KADAM 1) chali gayi hai
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

// --- Socket.IO Connection Handler (No Change) ---
io.on('connection', (socket) => {
  console.log('A user connected via Socket.IO:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected via Socket.IO:', socket.id);
  });
});

// --- Start Server (No Change) ---
server.listen(PORT, '0.0.0.0', () => { 
  console.log(`Server (Prisma Version) is running on port: ${PORT}`);
});
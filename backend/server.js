// --- FIX: Only run dotenv in development ---
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // Environment variables load karein (sirf local par)
  console.log("Running in development mode, loaded .env file.");
}
// --- END FIX ---

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const prisma = require('./config/prisma');

// --- Imports ---
const paymentRoutes = require('./routes/payment'); 
const couponRoutes = require('./routes/couponRoutes');
const planRoutes = require('./routes/planRoutes'); 

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
const attendanceRoutes = require('./routes/attendance'); 
const timetableRoutes = require('./routes/timetable');

const { apiLimiter } = require('./middleware/rateLimiter'); // Global Limiter Import

// --- Allowed URLs ki list (No Change) ---
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000", 
  "http://localhost:3000",
  "https://myedupanel.vercel.app" 
];
// --- END ---


// --- Express App Setup (No Change) ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Standard Middlewares (Order: CORS, JSON) ---
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json({ limit: '5mb' })); 
app.use(express.urlencoded({ limit: '5mb', extended: true }));

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

// --- Register API Routes (CORRECT ORDER) ---

app.get('/', (req, res) => {
  res.send('SchoolPro Backend is running (Prisma Version)!'); 
});

// 1. AUTH ROUTES (Yeh apne custom 'authLimiter' ka upyog karte hain)
app.use('/api/auth', authRoutes);

// 2. GLOBAL API LIMITER (Ab iske neeche ke sabhi routes par apiLimiter lag jayega)
// [Threat D solved for feature routes]
app.use('/api', apiLimiter);

// 3. FEATURE ROUTES (Ab ye sabhi rate limited hain)
app.use('/api/school', schoolRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
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
app.use('/api/attendance', attendanceRoutes); 
app.use('/api/timetable', timetableRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/plans', planRoutes);
app.set('trust proxy', 1);
// --- Socket.IO Connection Handler (No Change) ---
io.on('connection', (socket) => {
  console.log('A user connected via Socket.IO:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected via Socket.IO:', socket.id);
  });
});

// --- 4. GLOBAL ERROR HANDLER (CRASH PREVENTION) ---
app.use((err, req, res, next) => {
  console.error('SERVER CRASH DETECTED:', err.stack);

  // Default status code 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'An unexpected server error occurred.',
    // Production mein stack trace na bhejein
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// --- DATABASE CONNECTION & START SERVER (No Change) ---
async function startServer() {
  try {
    // Prisma client ko connect karein
    await prisma.$connect();
    console.log("Prisma Database connected successfully!");

    // Database connect hone ke baad hi server listen karein
    server.listen(PORT, '0.0.0.0', () => { 
      console.log(`Server (Prisma Version) is running on port: ${PORT}`);
    });

  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1); // Agar connect na ho toh exit karein
  }
}

// Server ko start karein
startServer();
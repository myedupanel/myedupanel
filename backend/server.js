// server.js (UPDATED: CORS & PORT FIXES)

// --- FIX: Only run dotenv in development ---
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // Environment variables load karein (sirf local par)
  console.log("Running in development mode, loaded .env file.");
}
// --- END FIX ---

const express = require('express');
const cors = require('cors'); // <-- Duplicate removed, only one here
const http = require('http');
const { Server } = require("socket.io");
const prisma = require('./config/prisma'); 

// --- Allowed URLs ki list (FRONTEND_URL ko dynamic rakha) ---
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000", 
  "http://localhost:3000",
  "https://myedupanel.vercel.app", // Aapka Vercel App
  "https://myedupanel.onrender.com" // Agar Render pe koi test/staging domain ho
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
const schoolRoutes = require('./routes/schoolRoutes');
const feeRoutes = require('./routes/fees');
const staffRoutes = require('./routes/staff');
const quizRoutes = require('./routes/quiz');
const analyticsRoutes = require('./routes/analytics');
const classRoutes = require('./routes/classes');
const attendanceRoutes = require('./routes/attendance'); 
const timetableRoutes = require('./routes/timetable');
const academicYearRoutes = require('./routes/academicYear');

// --- Express App Setup ---
const app = express();
// --- FIX: PORT ENV variable use karein ---
const PORT = process.env.PORT || 5000; // Render ya cloud PORT set karega, warna 5000

// --- NAYA CORS CONFIGURATION (Use function for strict checking) ---
const corsOptions = {
    origin: (origin, callback) => {
        // Agar request ka koi origin nahi hai (jaise Postman ya same server), ya woh allowed list mein hai
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Isse browser mein specific CORS error milega, server 500 nahi dega
            callback(new Error(`CORS policy not allowing access from origin: ${origin}`));
        }
    },
    credentials: true, // Zaroori hai cookies/headers ke liye
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"] // Essential headers explicitly allow karein
};

// CORS middleware ko sabse pehle apply karein
app.use(cors(corsOptions)); 
// --- END CORS FIX ---


// JSON parser ko hamesha routes register karne se PEHLE rakhein
app.use(express.json({ limit: '2mb' })); 

// --- Debugging Middleware (No Change) ---
app.use((req, res, next) => {
  console.log(`--> Request Received: ${req.method} ${req.originalUrl}`);
  next();
});

// --- HTTP Server and Socket.IO Setup (No Change) ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions // Socket.IO mein bhi wahi CORS options use karein
});

app.set('socketio', io);
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- Register API Routes (Order and paths are correct) ---
app.get('/', (req, res) => {
  res.send('SchoolPro Backend is running (Prisma Version)!'); 
});

app.use('/api/school', schoolRoutes); 
app.use('/api/auth', authRoutes);
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
app.use('/api/school', academicYearRoutes);


// --- Socket.IO Connection Handler (No Change) ---
io.on('connection', (socket) => {
  console.log('A user connected via Socket.IO:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected via Socket.IO:', socket.id);
  });
});

// --- DATABASE CONNECTION & START SERVER (Final Listening) ---
async function startServer() {
  try {
    // Prisma client ko connect karein
    await prisma.$connect();
    console.log("Prisma Database connected successfully!");

    // Database connect hone ke baad hi server listen karein
    // '0.0.0.0' address zaroori hai cloud deployment ke liye
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
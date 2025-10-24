require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

// --- ✨ NEW: Import all Mongoose Models Here ---
// Import models to ensure they are registered with Mongoose before routes use them
require('./models/School');
require('./models/User');
require('./models/Student');
require('./models/Teacher');
require('./models/Parent'); // Make sure this file exists
require('./models/FeeRecord'); // Make sure this file exists
// Add any other models you have (e.g., Class)
// require('./models/Class');
// --- End Model Imports ---

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Debugging Middleware
app.use((req, res, next) => {
  console.log(`--> Request Aayi: ${req.method} ${req.url}`);
  next();
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Custom Middleware to attach 'io' to every request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Register ALL API Routes Here (AFTER models are imported)
app.get('/', (req, res) => {
  res.send('SchoolPro Backend is running!');
});
// --- Ensure correct file names here ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin')); // Assuming file is admin.js
app.use('/api/students', require('./routes/students')); // Assuming file is student.js
// app.use('/api/classes', require('./routes/classes')); // Uncomment if you have this route
// app.use('/api/dashboard', require('./routes/dashboard')); // Uncomment if you have this route
app.use('/api/teachers', require('./routes/teacher')); // Assuming file is teacher.js
app.use('/api/parents', require('./routes/parents')); // Assuming file is parents.js
app.use('/api/school', require('./routes/schoolRoutes')); // Handles /api/school/profile
app.use('/api/schools', require('./routes/schoolRoutes')); // Assuming file is schoolRoutes.js
app.use('/api/fees', require('./routes/fees')); // Assuming file is fees.js
// --- End Route Definitions ---

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database Connection and Start Server
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    server.listen(PORT, '0.0.0.0', () => { // Listen on all interfaces for Render
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
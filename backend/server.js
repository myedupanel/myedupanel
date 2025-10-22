require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. Imports for Socket.IO
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Standard Middlewares
app.use(cors());
app.use(express.json());

// Debugging Middleware
app.use((req, res, next) => {
  console.log(`--> Request Aayi: ${req.method} ${req.url}`);
  next();
});

// 3. Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // -- CHANGE 1: 'origin' ko flexible banaya --
    // Ab yeh aapke live frontend (Vercel URL se) aur localhost, dono se connection lega
    origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// 4. Custom Middleware to attach 'io' to every request
//    THIS MUST BE PLACED BEFORE THE API ROUTES
app.use((req, res, next) => {
    req.io = io;
    next();
});

// 5. Register ALL API Routes Here
app.get('/', (req, res) => {
  res.send('SchoolPro Backend is running!');
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/students', require('./routes/students'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/dashboard', require('./routes/dashboard')); 
app.use('/api/teachers', require('./routes/teachers')); 
app.use('/api/parents', require('./routes/parents'));

// ✨ FIX: Yahaan naya '/api/school' route add kiya hai (Bonafide page ke liye)
app.use('/api/school', require('./routes/schoolRoutes')); // Handles /api/school/profile

app.use('/api/schools', require('./routes/schoolRoutes')); // Yeh aapka pehle wala route hai
app.use('/api/fees', require('./routes/fees'));

// 6. Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 7. Database Connection and Start Server
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    
    // -- CHANGE 2: Server '0.0.0.0' par listen karega --
    // Yeh Render ko batata hai ki public internet se requests accept karni hain
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port: ${PORT}`);
    });

  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
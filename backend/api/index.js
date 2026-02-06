require('dotenv').config(); // Reload after .env update
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
require('../config/passport');
const socketHandler = require('../socket/socketHandler');

// --- Routes import
const authRoutes = require('../routes/auth');       // auth routes
const userRoutes = require('../routes/users');      // user routes
const messageRoutes = require('../routes/messages'); // message routes

const app = express();
const server = http.createServer(app);

// --- 1️⃣ CORS for frontend
app.use(cors({
    origin: ['https://college-final-project-1.onrender.com', 'http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true
}));

// --- 2️⃣ Body parser & Passport
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// --- 2.5️⃣ Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- 3️⃣ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// --- 4️⃣ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));

// --- 5️⃣ Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: ['https://college-final-project-1.onrender.com', 'http://localhost:4200'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// --- 6️⃣ Socket.IO Setup with Handler
socketHandler(io);

// --- 7️⃣ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

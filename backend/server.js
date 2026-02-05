const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
require('./config/passport');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');

const app = express();
const server = http.createServer(app);

/* =========================
   DATABASE CONNECT
========================= */
connectDB();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
   origin: ['https://college-final-project-1.onrender.com', 'http://localhost:4200', 'http://127.0.0.1:4200'],
   credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

/* =========================
   STATIC FILES
========================= */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   API ROUTES
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
   res.status(200).json({ status: 'OK', message: 'Chat server is running' });
});

/* =========================
   SOCKET.IO SETUP
========================= */
const io = new Server(server, {
   cors: {
      origin: ['https://college-final-project-1.onrender.com', 'http://localhost:4200'],
      methods: ['GET', 'POST'],
      credentials: true
   }
});

let onlineUsers = new Map();

io.on('connection', (socket) => {
   console.log('New socket connected:', socket.id);

   socket.on('join-user', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('online-users', Array.from(onlineUsers.keys()));
   });

   // Join a group room
   socket.on('join-group', (groupId) => {
      socket.join(groupId);
      console.log(`User joined group: ${groupId}`);
   });

   socket.on('send-message', (data) => {
      const recipientSocket = onlineUsers.get(data.to);
      if (recipientSocket) {
         io.to(recipientSocket).emit('receive-message', data);
         socket.emit('message-sent', data);
      }
   });

   // Send group message
   socket.on('send-group-message', (data) => {
      // data should contain { group: groupId, content: ..., sender: ... }
      // Broadcast to everyone in the room except the sender
      socket.to(data.group).emit('receive-group-message', data);
   });

   socket.on('disconnect', () => {
      for (const [userId, id] of onlineUsers.entries()) {
         if (id === socket.id) {
            onlineUsers.delete(userId);
         }
      }
      io.emit('online-users', Array.from(onlineUsers.keys()));
      console.log('Socket disconnected:', socket.id);
   });
});

/* =========================
   ERROR HANDLING
========================= */
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({ message: 'Internal Server Error' });
});

app.use((req, res) => {
   res.status(404).json({ message: 'Route not found' });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});

module.exports = app;

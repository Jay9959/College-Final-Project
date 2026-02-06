const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

const connectDB = require('../config/db');
require('../config/passport');

// Routes
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const messageRoutes = require('../routes/messages');
const groupRoutes = require('../routes/groups');

const app = express();
const server = http.createServer(app);

/* =========================
   DATABASE
========================= */
connectDB();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: [
    'https://college-final-project-1.onrender.com',
    'http://localhost:4200'
  ],
  methods: ['GET', 'POST'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

/* =========================
   STATIC
========================= */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   ROUTES
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);

/* =========================
   SOCKET.IO
========================= */
const io = new Server(server, {
  cors: {
    origin: [
      'https://college-final-project-1.onrender.com',
      'http://localhost:4200'
    ],
    methods: ['GET', 'POST']
  }
});

let onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-user', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('online-users', [...onlineUsers.keys()]);
  });

  socket.on('join-group', (groupId) => {
    socket.join(groupId);
  });

  socket.on('send-message', (data) => {
    const receiverSocket = onlineUsers.get(data.to);
    if (receiverSocket) {
      io.to(receiverSocket).emit('receive-message', data);
    }
  });

  socket.on('send-group-message', (data) => {
    socket.to(data.group).emit('receive-group-message', data);
  });

  socket.on('disconnect', () => {
    for (const [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) onlineUsers.delete(userId);
    }
    io.emit('online-users', [...onlineUsers.keys()]);
    console.log('Socket disconnected:', socket.id);
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const messageRoutes = require('../routes/messages');

const app = express();
const server = http.createServer(app);

// --- CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// --- MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// --- Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// --- Online users
let onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('New socket connected:', socket.id);

  socket.on('join-user', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });

  socket.on('send-message', (data) => {
    const recipientSocket = onlineUsers.get(data.to);
    if (recipientSocket) {
      io.to(recipientSocket).emit('receive-message', data);
      socket.emit('message-sent', data);
    }
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

// --- Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('Server running on port', PORT));

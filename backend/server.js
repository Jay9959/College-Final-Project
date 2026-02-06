const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
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
const Message = require('./models/Message');
const Group = require('./models/Group');

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
  origin: '*', // Allow all origins for debugging/live connectivity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Preflight support
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

/* =========================
   STATIC FILES
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
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
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

  socket.on('send-message', async (data) => {
    try {
      // Save message to MongoDB
      const newMessage = new Message({
        sender: data.sender,
        receiver: data.to,
        content: data.content,
        messageType: data.messageType || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        mimeType: data.mimeType
      });

      const savedMessage = await newMessage.save();

      // Populate sender and receiver info
      await savedMessage.populate('sender', 'username avatar');
      await savedMessage.populate('receiver', 'username avatar');

      const receiverSocket = onlineUsers.get(data.to);

      // Emit to receiver if online
      if (receiverSocket) {
        io.to(receiverSocket).emit('receive-message', savedMessage);
      }

      // Also emit back to sender (ack) or useful if they have multiple tabs
      // socket.emit('message-sent', savedMessage); 
    } catch (error) {
      console.error('Socket send-message error:', error);
    }
  });

  socket.on('send-group-message', async (data) => {
    try {
      const newMessage = new Message({
        sender: data.sender,
        group: data.group,
        content: data.content,
        messageType: data.messageType || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        mimeType: data.mimeType
      });

      const savedMessage = await newMessage.save();

      // Populate sender and group info
      await savedMessage.populate('sender', 'username avatar');
      await savedMessage.populate('group');

      // Update Group last message
      await Group.findByIdAndUpdate(data.group, {
        lastMessage: savedMessage._id,
        lastMessageAt: new Date()
      });

      socket.to(data.group).emit('receive-group-message', savedMessage);
    } catch (error) {
      console.error('Socket send-group-message error:', error);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) onlineUsers.delete(userId);
    }
    io.emit('online-users', [...onlineUsers.keys()]);
    console.log('Socket disconnected:', socket.id);
  });
});

app.use(express.static(
  path.join(__dirname, 'dist/chat-frontend')
));

app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'dist/chat-frontend/index.html')
  );
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

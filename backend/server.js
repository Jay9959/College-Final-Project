const express = require('express');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
require('./config/passport');
const socketHandler = require('./socket/socketHandler');

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

/* =========================
   FRONTEND STATIC FILES
========================= */
const localFrontendPath = path.join(__dirname, '../frontend/dist/chat-frontend');
const builtFrontendPath = path.join(__dirname, 'dist/chat-frontend');
const staticPath = fs.existsSync(builtFrontendPath) ? builtFrontendPath : localFrontendPath;

console.log(`Serving static files from: ${staticPath}`);

app.use(express.static(staticPath));

app.get('*', (req, res) => {
  res.sendFile(
    path.join(staticPath, 'index.html')
  );
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

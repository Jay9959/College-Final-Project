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
/* =========================
   SOCKET.IO
========================= */
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Use the separate socket handler for full functionality
socketHandler(io);

/* =========================
   FRONTEND STATIC FILES
========================= */
const localFrontendPath = path.join(__dirname, '../frontend/dist/chat-frontend');
const builtFrontendPath = path.join(__dirname, 'dist/chat-frontend');

let staticPath = localFrontendPath;
if (fs.existsSync(builtFrontendPath)) {
  console.log('Found built frontend in backend/dist');
  staticPath = builtFrontendPath;
} else if (fs.existsSync(localFrontendPath)) {
  console.log('Found local frontend in ../frontend/dist');
  staticPath = localFrontendPath;
} else {
  console.warn('WARNING: No frontend build found! Run "ng build" in frontend directory.');
}

console.log(`Serving static files from: ${staticPath}`);

app.use(express.static(staticPath));

// Handle SPA routing - serve index.html for all unknown routes
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`Index file not found at: ${indexPath}`);
    res.status(404).send('Application not found - build may be missing');
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})
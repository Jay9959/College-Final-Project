// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const socketHandler = require('./socket/socketHandler');
// const passport = require('passport');
// require('./config/passport'); // Passport config

// // Import routes
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const messageRoutes = require('./routes/messages');

// // Initialize Express app
// const app = express();
// const server = http.createServer(app);

// // Initialize Socket.IO with CORS
// const io = new Server(server, {
//     cors: {
//         origin: [
//             'http://https://college-final-project-1.onrender.com',
//             'http://192.168.43.95:4200',
//             'http://192.168.1.147:4200',
//             process.env.CLIENT_URL // Add your Vercel URL here via environment variable
//         ],
//         methods: ['GET', 'POST', 'PUT', 'DELETE'],
//         credentials: true
//     }
// });

// // Connect to MongoDB
// // connectDB(); // Called in startServer

// // Middleware
// app.use(cors({
//     origin: [
//         'http://https://college-final-project-1.onrender.com',
//         'http://192.168.43.95:4200',
//         'http://192.168.1.147:4200',
//         process.env.CLIENT_URL
//     ],
//     credentials: true
// }));
// app.use(express.json());

// app.use(express.urlencoded({ extended: true }));
// app.use(passport.initialize());

// // Serve static files
// const path = require('path');
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/messages', messageRoutes);

// // Health check route
// app.get('/api/health', (req, res) => {
//     res.json({ status: 'OK', message: 'Chat server is running' });
// });

// // Initialize Socket.IO handlers
// socketHandler(io);

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ message: 'Something went wrong!' });
// });

// // 404 handler
// app.use((req, res) => {
//     res.status(404).json({ message: 'Route not found' });
// });

// // Start server
// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//     try {
//         await connectDB();
//         server.listen(PORT, '0.0.0.0', () => {
//             console.log(`
//   ╔═══════════════════════════════════════════╗
//   ║     Chat Server Running Successfully!     ║
//   ╠═══════════════════════════════════════════╣
//   ║  Local:   http://localhost:${PORT}        ║
//   ║  Network: http://192.168.43.95:${PORT}    ║
//   ║  Socket:  ws://192.168.43.95:${PORT}      ║
//   ╚═══════════════════════════════════════════╝
//   `);
//         });
//     } catch (error) {
//         console.error('Failed to start server:', error);
//         process.exit(1);
//     }
// };

// startServer();


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const path = require('path');

const connectDB = require('./config/db');
require('./config/passport');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

// Init app
const app = express();

/* =========================
   DATABASE CONNECT
========================= */
connectDB();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
   origin: process.env.CLIENT_URL || '*',
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

/* =========================
   HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
   res.status(200).json({
      status: 'OK',
      message: 'API server running on Vercel'
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
   EXPORT FOR VERCEL
========================= */
module.exports = app;

# Real-Time Chat Application

A complete real-time chat application with one-to-one messaging, online/offline status, typing indicators, and message delivery/seen status.

## Tech Stack

- **Backend**: Node.js + Express.js + Socket.IO
- **Database**: MongoDB with Mongoose
- **Frontend**: Angular 18 (Standalone Components)
- **Authentication**: JWT with bcrypt password hashing

## Features

✅ User registration & login  
✅ One-to-one real-time messaging  
✅ Online/offline user status  
✅ Typing indicator  
✅ Message delivered & seen status (✓ ✓✓)  
✅ Chat history stored in MongoDB  
✅ Secure REST APIs with JWT  
✅ WhatsApp-like dark theme UI  

## Project Structure

```
Final Project College/
├── chat-backend/
│   ├── config/db.js           # MongoDB connection
│   ├── middleware/auth.js     # JWT auth middleware
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Message.js         # Message schema
│   ├── routes/
│   │   ├── auth.js            # Login/Register
│   │   ├── users.js           # User endpoints
│   │   └── messages.js        # Message endpoints
│   ├── socket/socketHandler.js # Socket.IO events
│   ├── server.js              # Express entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
├── chat-frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Login, Register, Chat
│   │   │   ├── services/      # Auth, Socket, Chat services
│   │   │   ├── guards/        # Auth guard
│   │   │   ├── interceptors/  # JWT interceptor
│   │   │   ├── models/        # User, Message interfaces
│   │   │   └── app.routes.ts  # Routing configuration
│   │   ├── environments/      # API URLs config
│   │   └── styles.css         # Global styles
│   └── package.json
│
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally on `mongodb://localhost:27017`
- Angular CLI (optional): `npm install -g @angular/cli`

## Installation & Setup

### 1. Clone/Navigate to Project

```bash
cd "d:\Work\Final Project College"
```

### 2. Start MongoDB

Make sure MongoDB is running on your system:
```bash
# Windows (if installed as service, it should be running)
# Or start manually:
mongod
```

### 3. Setup Backend

```bash
cd chat-backend
npm install
npm start
```

Backend will run on: `http://localhost:5000`

### 4. Setup Frontend (New Terminal)

```bash
cd chat-frontend
npm install
npm start
```

Frontend will run on: `http://192.168.1.147:4200`

## Usage

1. Open `http://192.168.1.147:4200` in your browser
2. Click "Sign up" to create a new account
3. Register another account in an incognito/different browser
4. Login with both accounts
5. Select a user from the sidebar to start chatting
6. Send messages and see real-time updates!

## Environment Variables

Backend `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| GET | /api/users | Get all users |
| GET | /api/users/:id | Get user by ID |
| GET | /api/messages/:userId | Get chat history |
| PUT | /api/messages/read/:senderId | Mark messages as read |

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| join-user | Client→Server | User connects with userId |
| send-message | Client→Server | Send a message |
| receive-message | Server→Client | Receive a message |
| message-sent | Server→Client | Message sent confirmation |
| typing | Client→Server | Typing indicator |
| user-typing | Server→Client | User is typing |
| message-seen | Client→Server | Mark messages as seen |
| messages-seen | Server→Client | Messages were seen |
| user-status-change | Server→Client | Online/offline status |


## Screenshots

The application features a WhatsApp-inspired dark theme with:
- Green accent colors
- Clean sidebar with user list
- Chat bubbles with timestamps and status ticks
- Responsive mobile design

---

**Author**: Final Project College  
**License**: MIT

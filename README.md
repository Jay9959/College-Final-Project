# Real-time Chat Application

A full-featured, real-time messaging application built with the MEAN stack (MongoDB, Express.js, Angular, Node.js) and Socket.io.

## Features

### 🚀 Core Functionality
- **Real-time Messaging**: Instant message delivery using Socket.io.
- **User Authentication**: Secure Login and Registration system.
- **One-on-One Chat**: Private conversations between users.
- **Group Chat**: Create groups and chat with multiple members.
- **User Presence**: Real-time Online/Offline status indicators.
- **Typing Indicators**: See when the other user is typing.
- **Read Receipts**: Message delivery and "seen" status updates.

### 📸 Media & Sharing
- **File Sharing**: Send images, videos, audio, and documents.
- **Media Previews**: Preview images and videos before sending.
- **Avatar Upload**: Custom profile picture uploads.

### 📞 Communication
- **Voice Calls**: High-quality voice calling.
- **Video Calls**: Real-time video calling support.
- **Call Logs**: History of missed and ended calls.

### ⚙️ Customization & Settings
- **Themes**: Switch between Light, Dark, and System themes.
- **Wallpapers**: Custom chat wallpapers with doodle support.
- **Privacy Settings**: Control who can see your Last Seen, Profile Photo, etc.
- **Notifications**: Custom notification tones and preferences.
- **Security**: App lock feature with password protection.

## Tech Stack

### Frontend
- **Framework**: Angular 18+ (Standalone Components)
- **Styling**: CSS3, Responsive Design
- **Real-time**: Socket.io-client
- **HTTP**: HttpClient

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io
- **Authentication**: Passport.js / JWT
- **File Handling**: Multer

## Project Structure

```
├── backend/                 # Node.js/Express Server
│   ├── config/             # DB and Passport config
│   ├── models/             # Mongoose Models (User, Message, Group)
│   ├── routes/             # API Routes (auth, users, messages, groups)
│   ├── socket/             # Socket.io Event Handlers
│   └── server.js           # Entry point
│
└── frontend/               # Angular Client
    ├── src/
    │   ├── app/
    │       ├── components/ # UI Components (Chat, Login, etc.)
    │       ├── models/     # TypeScript Interfaces
    │       ├── services/   # API and Socket Services
    │       └── ...
    └── environments/       # Environment config (Dev/Prod)
```

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URL)
- Angular CLI (`npm install -g @angular/cli`)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder with the following keys:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:4200
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update `src/environments/environment.ts` if needed (defaults to localhost:5000).
4. Run the application:
   ```bash
   ng serve
   ```
5. Open `http://localhost:4200` in your browser.

## Deployment

### Backend
- Configure `environment.prod.ts` in the frontend to point to your deployed backend URL.
- Ensure your backend `CLIENT_URL` matches your deployed frontend domain.
- The backend handles serving static frontend files if built into `backend/dist`.

### Frontend
- Build the project:
  ```bash
  ng build --configuration production
  ```
- Upload the `dist` folder to your hosting provider or serve via the backend.

## API Endpoints

- **POST /api/auth/register**: Register a new user.
- **POST /api/auth/login**: Login user.
- **GET /api/users**: Get all users.
- **GET /api/messages/:userId**: Get chat history with a user.
- **POST /api/groups**: Create a new group.

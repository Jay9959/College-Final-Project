const express = require('express');
const serverless = require('serverless-http');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Example route
app.get('/api/test', (req, res) => {
  res.json({ message: "Hello from backend!" });
});

module.exports.handler = serverless(app);

require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const WebSocketServer = require('./socket/websocket.js');
const {initializeWebSocket}= require('./socket/websocket.js');


const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.DB_KEY || 'mongodb+srv://akshatkindle:Aisehi%401234@akbase.zt293q8.mongodb.net/wsapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Initialize HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
WebSocketServer.initializeWebSocket(server);

// Initialize routes


// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
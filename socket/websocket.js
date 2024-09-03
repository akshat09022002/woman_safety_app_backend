const WebSocket = require('ws');
const HelpSession = require('../models/helpSession');
const User = require('../models/user');

const initializeWebSocket = (server) => {
 let wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      // Handle panic button press, accepting help, etc.
    });

    ws.on('close', () => {
      
    });
  });
};

const sendNotificationToNearbyUsers = async (location, message) => {
  // Implementation to send a notification to users within 1km
};

module.exports = {
  initializeWebSocket,
  sendNotificationToNearbyUsers,
};

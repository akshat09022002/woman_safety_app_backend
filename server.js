const http = require('http');
const WebSocketServer = require('./socket/websocket.js'); // Import the module

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server running');
});

WebSocketServer.initializeWebSocket(server);

server.listen(5173, () => {
  console.log('Server running on port 5173');
});
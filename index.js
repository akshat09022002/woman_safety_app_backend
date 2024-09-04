const express = require('express');
const cors = require('cors');
const http = require('http');
const authMiddleware = require('./middleware/authMiddleware'); 
const { initializeRoutes } = require('./routes/userRoutes'); 
const app = express();
const PORT = 3000;

const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());
app.use(cors());

initializeRoutes(app);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

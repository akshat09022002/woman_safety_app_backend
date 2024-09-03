const express = require('express');
const cors = require('cors');
const { urlRoute } = require('./routes/url');
const { userRoute } = require('./routes/user');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use('/user', userRoute);
app.use('/tinyurl', urlRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

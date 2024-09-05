const express = require('express');
const cors = require('cors');
const {userRoute} = require('./controllers/userController')

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

app.use('/api/v1/user',userRoute);

app.listen(PORT, () => {
  console.log(`http is running on port ${PORT}`);
});

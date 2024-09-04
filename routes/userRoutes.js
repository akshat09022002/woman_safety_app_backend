const { Router } = require('express');
const { findNearbyPeople, sendSMS, signup, login , createFirstUser} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// Route for finding nearby people
router.get('/find-nearby', authMiddleware, findNearbyPeople);

// Route for sending SMS to emergency contacts and nearby people
router.post('/send-sms', authMiddleware, sendSMS);

// Route for user signup
router.post('/signup', signup);

// Route for user login
router.post('/login', login);

// Route for creating the first user (admin)
router.post('/create-first-user', createFirstUser);


const initializeRoutes = (app) => {
  app.use('/api', router);
};

module.exports = { initializeRoutes };

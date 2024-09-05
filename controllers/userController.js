const express=require('express');
const {User,HelpSession} = require("../schemas/schema");
const jwt = require("jsonwebtoken");
const axios = require('axios');
const fast2sms = require("fast-two-sms");


const app=express();
app.use(express.json());

const router=express.Router();



// Find nearby people within a 1 km radius
router.get('/find-nearby', async (req, res) => {
  try {

    const locationResponse = await axios.get('https://ipapi.co/json/');
    const locationData = locationResponse.data;

    // Ensure the location data contains the required fields
    if (!locationData || !locationData.longitude || !locationData.latitude) {
      return res.status(500).json({ error: "Unable to fetch current location" });
    }

    const currentLocation = {
      type: 'Point',
      coordinates: [locationData.longitude, locationData.latitude] 
    };

    const nearbyUsers = await User.aggregate([
      {
        $geoNear: {
          near: currentLocation, 
          distanceField: "distance",
          spherical: true,
        },
      },
      {
        $match: {
          distance: { $lte: 1000 }, 
        },
      },
      {
        $group: {
          _id: "$gender", 
          count: { $sum: 1 }, 
        },
      },
    ]);

    const genderCounts = {
      male: 0,
      female: 0,
    };

    // Populate male and female counts
    nearbyUsers.forEach((user) => {
      if (user._id === "male") {
        genderCounts.male = user.count;
      } else if (user._id === "female") {
        genderCounts.female = user.count;
      }
    });

    res.json({ genderCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Send SMS to emergency contacts and nearby people
router.post('/send-sms',async (req, res) => { 
  const { userId, message } = req.body;

  try {
    const user = await User.findById(userId).populate("emergencyContacts");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send SMS to emergency contacts
    const phoneNumbers = user.emergencyContacts.map((contact) =>
      contact.phoneNo.toString()
    );
    const response = await fast2sms.sendMessage({
      authorization: process.env.FAST2SMS_API_KEY,
      message,
      numbers: phoneNumbers,
    });

    res.json({ message: "SMS sent successfully", response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User signup
router.post('/signup',async (req, res) => { 
  const { name, email, password, phoneNo, gender } =await req.body;
 
  try {
    
    const locationResponse = await axios.get('https://ipapi.co/json/');
    const locationData = locationResponse.data;
    console.log(locationData, "location");

   
    const location = {
      type: 'Point',
      coordinates: [parseFloat(locationData.longitude), parseFloat(locationData.latitude)]
    };

    
    const user = new User({ name, email, password, phoneNo, gender, location });
    
    await user.save();

    res.status(201).json({ 
      msg:'Signup Successful'
     });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User login
router.post('/login',async (req, res) => { 
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password != password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    else
    {
      return res.status(201).json({msg:"Logged in successfully!" ,userId: user._id });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

});

//User Logout
router.post('/logout', async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = {
  userRoute: router
};

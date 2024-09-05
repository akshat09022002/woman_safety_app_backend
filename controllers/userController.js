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
    // Fetch the current location using Google Maps Geolocation API
    const locationResponse = await axios.post('https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyAtWt9ACf5HMAIoMxxvM6BVoPNaLnzJ1gc');
    
    // Ensure the location data contains the required fields
    const { lat, lng } = locationResponse.data.location || {};
    if (!lat || !lng) {
      return res.status(500).json({ error: "Unable to fetch current location" });
    }

    const currentLocation = {
      type: 'Point',
      coordinates: [lng, lat] // Note: [lng, lat] order is used in GeoJSON
    };

    // Query the database for nearby users
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

module.exports = router;


// Send SMS to emergency contacts and nearby people
router.post('/send-sms',async (req, res) => { 
  const { userId } = req.body;
  
  try {
    const user= await User.findOne({
      _id: userId
    });
    if(user){
      const message=`Urgent assistance required! ${user.name} is in distress and needs immediate help`;
      const encodedString = message.replace(/ /g, '%20');
      console.log(encodedString);

      user.emergencyContacts.map(async (person)=>{
        const number= parseInt(person.contact,10);
        const response=await axios.get(`https://www.fast2sms.com/dev/bulkV2?authorization=fn0xZcKjJaQ2DqvRsb1YX6WuGMgt7TAiVB89y4kEel5CSLINPmDyY3Jg2GOkVAmf9CZeLR0H6hXsFxdK&route=q&message=${encodedString}&flash=1&numbers=${number}`);
        console.log(response);
      })

      res.status(200).json({msg:"message sent"});
    }
    else{
      res.status(403).json({msg:"Invalid Request"});
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//add contact route
router.post('/add-contact',async (req,res)=>{
  const {userId,name,number} = req.body;

  try{
    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        $push: {
          emergencyContacts: { name, contact:number }
        }
      }
    );

    if(!user){
      return res.status(404).json({ message: 'User not found' });
    }else{
      res.status(200).json({ message: 'Contacts updated successfully' });
    }
  }catch{

  }
})

// User signup
router.post('/signup', async (req, res) => {
  const { name, email, password, phoneNo, gender } = req.body;

  try {
    // Fetch location using Google Maps Geolocation API
    const locationResponse = await axios.post('https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyAtWt9ACf5HMAIoMxxvM6BVoPNaLnzJ1gc');
    console.log(locationResponse);

    // Handle location data
    const location = {
      type: 'Point',
      coordinates: [
        parseFloat(locationResponse.data.location.lng), // Longitude
        parseFloat(locationResponse.data.location.lat)  // Latitude
      ]
    };

    // Create and save the user
    const user = new User({ name, email, password, phoneNo, gender, location });
    await user.save();

    res.status(201).json({ msg: 'Signup Successful' });
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
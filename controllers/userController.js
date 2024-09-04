const express=require('express');
const {User,HelpSession} = require("../schemas/schema");
const jwt = require("jsonwebtoken");
const axios = require('axios');
const fast2sms = require("fast-two-sms");


const app=express();
app.use(express.json());

const router=express.Router();
// Find nearby people within a 1 km radius
router.get('/find-nearby',async (req, res) => { 
  const { longitude, latitude } = req.query;

  try {
    const nearbyUsers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distance",
          maxDistance: 1000, // 1 km radius
          spherical: true,
        },
      },
      {
        $sort: { distance: 1 },
      },
    ]);

    res.json({ nearbyUsers });
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
  const { name, email, password, phoneNo } =await req.body;
  console.log(name);
 
  try {
    
    const locationResponse = await axios.get('https://ipapi.co/json/');
    const locationData = locationResponse.data;
    console.log(locationData, "location");

   
    const location = {
      type: 'Point',
      coordinates: [parseFloat(locationData.longitude), parseFloat(locationData.latitude)]
    };

    
    const user = new User({ name, email, password, phoneNo, location });
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

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Connect to the WebSocket server
    const socket =  new WebSocket("ws://localhost:3000");

    // Handle WebSocket connection
    socket.onopen = () => {
        console.log("Connected to WebSocket server");

      // Function to fetch location and emit to the socket
      const fetchAndSendLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;

            // Emit location data to the WebSocket server
            socket.send(JSON.stringify({ latitude, longitude }));
            console.log("Location sent:", { latitude, longitude })

            // Schedule the next location fetch
            setTimeout(fetchAndSendLocation, 30000); // 30 seconds
          },
          (error) => {
            console.error("Error fetching location:", error);
          }
        );
      };

      // Start fetching and sending location
      fetchAndSendLocation();
    };

    // Handle WebSocket connection error
    socket.onerror("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
      
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

//creating the first user
router.get('/create-first-router',async (req, res) => { 
  const { name, email, password, phoneNo, gender } = req.body;

  try {
    // Check if any users exist in the database
    const existingUsers = await User.countDocuments();

    if (existingUsers > 0) {
      return res
        .status(403)
        .json({ error: "The first user has already been created." });
    }

    const locationResponse = await axios.get('https://ipapi.co/json/');
    const locationData = locationResponse.data;
    console.log(locationData, "location");

    const currentLocation = {
      type: 'Point',
      coordinates: [locationData.longitude, locationData.latitude] // Use the fetched longitude and latitude
    };



    // Create the first user
    const user = await User.create({
        name,
        email,
        password,
        phoneNo,
        gender,
        location:currentLocation
      });
      
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({ message: "First user created successfully", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/try',async(req,res)=>{
  return res.status(200).json({
    msg:"hii there"
  })
})

// logout ki api aur usko click karte hi socket close kardena

module.exports = {
  userRoute: router
};

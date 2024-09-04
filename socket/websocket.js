const WebSocket = require("ws");
const HelpSession = require("../schemas/schema.js");
const User = require("../schemas/schema.js");

function getUserIdFromRequest(req) {
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  return urlParams.get('userId');
}

const initializeWebSocket = (server) => {
  let wss = new WebSocket.Server({ server });

  const broadcast = (message,userId) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId!=userId) {
        client.send(message);
      }
    });
  };

  wss.on("connection", (ws, req) => {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      ws.close(); // Close the connection if userId is not provided
      return;
    } else {
      ws.userId = userId;
    }

    ws.on("message", async (message) => {
      const data = JSON.parse(message);

      if(data.action === "sms") {
        ws.send("hi")
      }

      //yaha pe action trigger karna h after every login 
      if (data.action === "updateLocation") {
        await User.findOneAndUpdate(
          { _id: ws.userId },
          {
            location: {
              type: "Point",
              coordinates: [data.longitude, data.latitude],
            },
          }
        );
        console.log("Location updated for user:", ws.userId);

      } else if (data.action === "panic") {
        const helpSession = await HelpSession.create({
          victimId: ws.userId,
          name: data.name,
          location: {
            type: "Point",
            coordinates: [data.longitude, data.latitude],
          },
        });

        const nearbyUsers = await User.aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: [data.longitude, data.latitude] },
              distanceField: "distance",
              maxDistance: 1000, // 1 km radius
              spherical: true,
            },
          },
          {
            $sort: { distance: 1 }, // Sort by distance ascending (closest users first)
          },
        ]);

        nearbyUsers.forEach((user) => {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.userId.toString() === user._id.toString()) {
              client.send(JSON.stringify({
                type: 'panicNotification',
                sessionId: helpSession._id,
                name: helpSession.name,
                victimId: ws.userId,
                location: {
                  type: "Point",
                  coordinates: [data.longitude, data.latitude],
                },
              }));
            }
          });
        });

      } 
      //make a component which is like component {attributes it will contain are: name, location, two buttons[ignore, help]}
      else if(data.action === "broadcast"){
        broadcast(JSON.stringify({
          from: ws.userId,
          message: data.message
        }),ws.userId);
      }
    });

    ws.on("close", () => {
      console.log("User Disconnected:", ws.userId);
    });
  });

};

module.exports = {
  initializeWebSocket,
};

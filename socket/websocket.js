const WebSocket = require("ws");
const {HelpSession,User} = require("../schemas/schema.js");


function getUserIdFromRequest(req) {
  const urlParams = new URLSearchParams(req.url.split("?")[1]);
  return urlParams.get("userId");
}

const initializeWebSocket = (server) => {
  let wss = new WebSocket.Server({ server });

  const broadcast = (message, userId) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
        client.send(message);
      }
    });
  };

  const startBroadcastInterval = (ws, victimId, sessionId) => {
    const intervalId = setInterval(async () => {
      const user = await User.findOne({ _id: victimId });
      const helpSession = await HelpSession.findOne({ _id: sessionId });

      if (helpSession && !helpSession.isClosed) {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client.userId === ws.userId) {
            client.send(JSON.stringify({
              sessionId: helpSession._id,
              victimId: user._id,
              name: user.name,
              location: user.location
            }));
          }
        });
      } else {
        clearInterval(intervalId);
      }
    }, 30000); // Broadcast every 30 seconds
    return intervalId; // Return the interval ID if needed
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
        console.log(data);
        const helpSession = await HelpSession.create({
          victimId: ws.userId,
          name: data.name,
          location: {
            type: "Point",
            coordinates: [Number(data.longitude), Number(data.latitude)],
          },
        });

        // const nearbyUsers = await User.aggregate([
        //   {
        //     $geoNear: {
        //       near: {
        //         type: "Point",
        //         coordinates: [data.longitude, data.latitude],
        //       },
        //       distanceField: "distance",
        //       maxDistance: 1000, // 1 km radius
        //       spherical: true,
        //     },
        //   },
        //   {
        //     $sort: { distance: 1 }, // Sort by distance ascending (closest users first)
        //   },
        // ]);
        

        // nearbyUsers.forEach((user) => {
          wss.clients.forEach((client) => {
            if (
              client.readyState === WebSocket.OPEN &&
              // client.userId.toString() === user._id.toString()
              client.userId=== data._id
            ) {
              client.send(
                JSON.stringify({
                  type: "panicNotification",
                  sessionId: helpSession._id,
                  name: helpSession.name,
                  victimId: ws.userId,
                  location: {
                    type: "Point",
                    coordinates: [data.longitude, data.latitude],
                  },
                })
              );
            }
          });
        // });
      } else if (data.action === "broadcast") {
        broadcast(
          JSON.stringify({
            from: ws.userId,
            message: data.message,
          }),
          ws.userId
        );
      } else if (data.action === "helping") {
        const result = await HelpSession.updateOne(
          { _id: data.sessionId },
          {
            $push: {
              acceptors: {
                userId: ws.userId,
              },
            },
          }
        );

        // Start broadcasting the victim's location every 30 seconds
        startBroadcastInterval(ws, result.victimId, result._id);
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
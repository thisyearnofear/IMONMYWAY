import { createServer } from "http";
import { Server } from "socket.io";
import { locationService } from "../src/lib/shared/LocationService.js";

// Distance calculation utility
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

const port = process.env.PORT || 3001;

// Create HTTP server
const server = createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      activeSessions: locationService.getActiveSessionsCount()
    }));
    return;
  }
  
  // CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "https://imonmyway.netlify.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle sharing session creation
  socket.on("createSharingID", (data, callback) => {
    try {
      // Deactivate any existing session for this socket
      if (socket.sharingId) {
        locationService.deactivateSession(socket.sharingId);
      }

      const session = locationService.createSession(data);
      socket.sharingId = session.sharingId;

      console.log("Created sharing session:", session.sharingId);

      if (callback) {
        callback({ success: true, sharingId: session.sharingId });
      }
    } catch (err) {
      console.error("Error creating sharing session:", err);
      if (callback) {
        callback({
          success: false,
          message: "Failed to create sharing session",
        });
      }
    }
  });

  // Handle location updates
  socket.on("updateLocation", (locationData) => {
    try {
      let session = locationService.updateSession(locationData.sharingId, {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        active: locationData.active !== false,
      });

      if (session && session.destination) {
        // Calculate ETA if destination is set
        const distance = calculateDistance(
          session.latitude,
          session.longitude,
          session.destination.lat,
          session.destination.lng
        );
        const eta = distance * session.pace;
        session = locationService.updateSession(session.sharingId, { eta });
      }

      if (session) {
        // Broadcast to all watchers in the room
        socket.to(session.sharingId).emit("watch", { locationData: session });
        console.log("Location updated for session:", session.sharingId);
      }
    } catch (err) {
      console.error("Error updating location:", err);
    }
  });

  // Handle destination setting
  socket.on("setDestination", (data) => {
    try {
      const { sharingId, destination } = data;
      const session = locationService.setDestination(sharingId, destination);

      if (session) {
        // Recalculate ETA if we have current location
        if (session.latitude && session.longitude) {
          const distance = calculateDistance(
            session.latitude,
            session.longitude,
            destination.lat,
            destination.lng
          );
          const eta = distance * session.pace;
          locationService.updateSession(sharingId, { eta });
        }

        console.log("Destination set for session:", sharingId);
      }
    } catch (err) {
      console.error("Error setting destination:", err);
    }
  });

  // Handle watchers joining a room
  socket.on("join", ({ sharingId }) => {
    try {
      socket.join(sharingId);
      console.log("User joined room:", sharingId);

      // Send current session data to the new watcher
      const session = locationService.getSession(sharingId);
      if (session) {
        socket.emit("watch", { locationData: session });
      }
    } catch (err) {
      console.error("Error joining room:", err);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.sharingId) {
      const session = locationService.deactivateSession(socket.sharingId);
      if (session) {
        // Notify watchers that the session is now inactive
        socket.to(session.sharingId).emit("watch", { locationData: session });
        console.log("Deactivated session:", socket.sharingId);
      }
    }
  });
});

server
  .once("error", (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Backend server ready on port ${port}`);
    console.log(`> Health check: http://localhost:${port}/health`);
  });
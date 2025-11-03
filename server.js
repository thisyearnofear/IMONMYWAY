// Enhanced Production Server with Real-time GPS Support
// ENHANCEMENT FIRST: Building upon existing Next.js server

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO for real-time features
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ["https://imonmyway.netlify.app"] 
        : ["http://localhost:3000"],
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Store active tracking sessions
  const trackingSessions = new Map();
  const bettingRooms = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // ============================================================================
    // GPS LOCATION TRACKING
    // ============================================================================

    socket.on('location-update', (data) => {
      const { userId, commitmentId, latitude, longitude, accuracy, timestamp, trackingDuration } = data;
      
      console.log(`📍 Location update from ${userId}: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy}m)`);
      
      // Store tracking session
      trackingSessions.set(userId, {
        ...data,
        socketId: socket.id,
        lastUpdate: Date.now()
      });

      // Broadcast to commitment room if applicable
      if (commitmentId) {
        socket.to(`commitment-${commitmentId}`).emit('location-update', data);
      }

      // Broadcast to user's followers/friends
      socket.to(`user-${userId}`).emit('location-update', data);
    });

    socket.on('verify-location', (verification) => {
      console.log(`✅ Location verification:`, verification);
      
      // Broadcast verification result
      socket.emit('location-verified', verification);
      
      // If within threshold, notify commitment room
      if (verification.withinThreshold && verification.commitmentId) {
        socket.to(`commitment-${verification.commitmentId}`).emit('arrival-verified', verification);
      }
    });

    socket.on('location-error', (error) => {
      console.error(`❌ Location error from ${socket.id}:`, error);
      // Could log to monitoring service here
    });

    socket.on('location-tracking-stopped', (data) => {
      console.log(`📍 Tracking stopped for ${socket.id}:`, data);
      // Clean up tracking session
      for (const [userId, session] of trackingSessions.entries()) {
        if (session.socketId === socket.id) {
          trackingSessions.delete(userId);
          break;
        }
      }
    });

    // ============================================================================
    // BETTING SYSTEM
    // ============================================================================

    socket.on('subscribe-betting', ({ commitmentId }) => {
      console.log(`📊 Client ${socket.id} subscribed to betting for commitment: ${commitmentId}`);
      socket.join(`commitment-${commitmentId}`);
      
      // Send current betting stats if available
      const bettingData = bettingRooms.get(commitmentId);
      if (bettingData) {
        socket.emit('betting-update', bettingData);
      }
    });

    socket.on('unsubscribe-betting', ({ commitmentId }) => {
      console.log(`📊 Client ${socket.id} unsubscribed from betting for commitment: ${commitmentId}`);
      socket.leave(`commitment-${commitmentId}`);
    });

    socket.on('bet-placed', (betData) => {
      const { commitmentId, amount, prediction, odds } = betData;
      console.log(`💰 Bet placed on commitment ${commitmentId}: ${amount} STT for ${prediction}`);
      
      // Update betting room data
      const currentData = bettingRooms.get(commitmentId) || { totalBets: 0, totalAmount: '0' };
      currentData.totalBets += 1;
      currentData.totalAmount = (parseFloat(currentData.totalAmount) + parseFloat(amount)).toString();
      bettingRooms.set(commitmentId, currentData);

      // Broadcast to all subscribers
      io.to(`commitment-${commitmentId}`).emit('betting-update', {
        commitmentId,
        betId: `bet-${Date.now()}`,
        amount,
        prediction,
        odds,
        timestamp: Date.now()
      });

      io.to(`commitment-${commitmentId}`).emit('betting-placed', {
        commitmentId,
        totalBets: currentData.totalBets,
        totalAmount: currentData.totalAmount
      });
    });

    // ============================================================================
    // EXISTING REAL-TIME EVENTS (PRESERVED)
    // ============================================================================

    socket.on('leaderboard:update', (data) => {
      console.log('📊 Leaderboard update:', data);
      io.emit('leaderboard:update', data);
    });

    socket.on('profile:update', (data) => {
      console.log('👤 Profile update:', data);
      socket.to(`user-${data.walletAddress}`).emit('profile:update', data);
    });

    socket.on('achievement:unlocked', (data) => {
      console.log('🏆 Achievement unlocked:', data);
      io.emit('achievement:unlocked', data);
    });

    socket.on('reputation:changed', (data) => {
      console.log('⭐ Reputation changed:', data);
      socket.to(`user-${data.walletAddress}`).emit('reputation:changed', data);
    });

    socket.on('session:completed', (data) => {
      console.log('✅ Session completed:', data);
      io.emit('session:completed', data);
    });

    // ============================================================================
    // CONNECTION MANAGEMENT
    // ============================================================================

    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`👤 Client ${socket.id} joined user room: ${userId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
      
      // Clean up tracking sessions
      for (const [userId, session] of trackingSessions.entries()) {
        if (session.socketId === socket.id) {
          trackingSessions.delete(userId);
          console.log(`📍 Cleaned up tracking session for user: ${userId}`);
          break;
        }
      }
    });

    // Send connection confirmation
    socket.emit('connected', { 
      message: 'Connected to IMONMYWAY real-time server',
      features: ['gps-tracking', 'betting', 'leaderboard', 'achievements'],
      timestamp: Date.now()
    });
  });

  // ============================================================================
  // HEALTH CHECK & MONITORING
  // ============================================================================

  // Clean up stale tracking sessions every 5 minutes
  setInterval(() => {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, session] of trackingSessions.entries()) {
      if (now - session.lastUpdate > staleThreshold) {
        trackingSessions.delete(userId);
        console.log(`🧹 Cleaned up stale tracking session for user: ${userId}`);
      }
    }
  }, 5 * 60 * 1000);

  // Server status endpoint
  server.on('request', (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connections: io.engine.clientsCount,
        trackingSessions: trackingSessions.size,
        bettingRooms: bettingRooms.size,
        features: ['gps-tracking', 'betting', 'real-time-updates']
      }));
      return;
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 IMONMYWAY server ready on http://${hostname}:${port}`);
    console.log(`📡 Socket.IO server ready for real-time features`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
// Simple in-memory storage for the Punctuality Protocol
// Replaces PostgreSQL dependency for hackathon demo

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

// In-memory storage objects
const storage = {
  users: new Map(),
  sessions: new Map(),
  commitments: new Map(),
  bets: new Map(),
  userBets: new Map(),
  userAchievements: new Map(),
  streaks: new Map(),
  routes: new Map(),
  analyticsEvents: new Map(),
  performanceMetrics: new Map()
};

// ============================================================================
// DATABASE SERVICE (In-Memory Implementation)
// ============================================================================

export class DatabaseService {
  // ============================================================================
  // HEALTH CHECKS & CONNECTION MANAGEMENT
  // ============================================================================

  async healthCheck() {
    // Always healthy in memory implementation
    console.log('✅ In-memory storage healthy');
    return { postgresql: true, redis: true };
  }

  async connect() {
    console.log('✅ In-memory storage connected successfully');
  }

  async disconnect() {
    console.log('✅ In-memory storage disconnected successfully');
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async createUser(walletAddress: string, userData?: {
    email?: string
    username?: string
    displayName?: string
  }) {
    try {
      const userId = `user_${walletAddress}`;
      const user = {
        id: userId,
        walletAddress,
        ...userData,
        reputationScore: 750.0,
        totalStaked: "0",
        totalEarned: "0",
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      
      storage.users.set(walletAddress, user);
      console.log(`✅ User created: ${walletAddress}`);
      return user;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async getUserByWallet(walletAddress: string) {
    try {
      return storage.users.get(walletAddress) || null;
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw error;
    }
  }

  async updateUser(walletAddress: string, updates: Partial<{
    email: string
    username: string
    displayName: string
    reputationScore: number
    totalStaked: string
    totalEarned: string
  }>) {
    try {
      const user = storage.users.get(walletAddress);
      if (!user) throw new Error('User not found');
      
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      storage.users.set(walletAddress, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      return Array.from(storage.users.values());
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
      throw error;
    }
  }

  async getAnalytics(walletAddress: string) {
    try {
      const userAnalytics = [];
      for (const [_, event] of storage.analyticsEvents) {
        if (event.userId === walletAddress) {
          userAnalytics.push({
            ...event,
            metadata: event.eventData || {}
          });
        }
      }
      return userAnalytics;
    } catch (error) {
      console.error('❌ Error fetching user analytics:', error);
      throw error;
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async createSession(userId: string, token: string, expiresAt: Date, metadata?: {
    ipAddress?: string
    userAgent?: string
  }) {
    try {
      const session = {
        id: token,
        userId,
        token,
        expiresAt,
        ...metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      storage.sessions.set(token, session);
      return session;
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  }

  async getSessionByToken(token: string) {
    try {
      return storage.sessions.get(token) || null;
    } catch (error) {
      console.error('❌ Error fetching session:', error);
      throw error;
    }
  }

  async updateSessionLocation(sessionId: string, latitude: number, longitude: number) {
    try {
      const session = storage.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');
      
      const updatedSession = {
        ...session,
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      };
      
      storage.sessions.set(sessionId, updatedSession);
      return updatedSession;
    } catch (error) {
      console.error('❌ Error updating session location:', error);
      throw error;
    }
  }

  async invalidateSession(token: string) {
    try {
      storage.sessions.delete(token);
      console.log(`✅ Session invalidated: ${token}`);
    } catch (error) {
      console.error('❌ Error invalidating session:', error);
      throw error;
    }
  }

  // ============================================================================
  // COMMITMENT MANAGEMENT
  // ============================================================================

  async createCommitment(commitmentData: {
    userId: string
    commitmentId: string
    stakeAmount: string
    deadline: Date
    startLatitude: number
    startLongitude: number
    targetLatitude: number
    targetLongitude: number
    estimatedDistance: number
    estimatedPace: number
  }) {
    try {
      const commitment = {
        id: commitmentData.commitmentId,
        ...commitmentData,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      storage.commitments.set(commitmentData.commitmentId, commitment);
      return commitment;
    } catch (error) {
      console.error('❌ Error creating commitment:', error);
      throw error;
    }
  }

  async getCommitment(commitmentId: string) {
    try {
      return storage.commitments.get(commitmentId) || null;
    } catch (error) {
      console.error('❌ Error fetching commitment:', error);
      throw error;
    }
  }

  async updateCommitmentStatus(commitmentId: string, status: string, resultData?: {
    actualArrivalTime?: Date
    success?: boolean
    payoutAmount?: string
  }) {
    try {
      const commitment = storage.commitments.get(commitmentId);
      if (!commitment) throw new Error('Commitment not found');
      
      const updatedCommitment = {
        ...commitment,
        status,
        ...resultData,
        updatedAt: new Date()
      };
      
      storage.commitments.set(commitmentId, updatedCommitment);
      return updatedCommitment;
    } catch (error) {
      console.error('❌ Error updating commitment:', error);
      throw error;
    }
  }

  // ============================================================================
  // BETTING MANAGEMENT
  // ============================================================================

  async createBet(betData: {
    commitmentId: string
    bettorId: string
    amount: string
    prediction: string
    odds?: number
  }) {
    try {
      const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const bet = {
        id: betId,
        ...betData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      storage.bets.set(betId, bet);
      return bet;
    } catch (error) {
      console.error('❌ Error creating bet:', error);
      throw error;
    }
  }

  async getUserBets(userId: string, limit = 50) {
    try {
      const userBets = [];
      for (const [_, bet] of storage.bets) {
        if (bet.bettorId === userId && userBets.length < limit) {
          userBets.push(bet);
        }
      }
      return userBets;
    } catch (error) {
      console.error('❌ Error fetching user bets:', error);
      throw error;
    }
  }

  // ============================================================================
  // ACHIEVEMENT & STREAK MANAGEMENT
  // ============================================================================

  async unlockAchievement(userId: string, achievementId: string) {
    try {
      const achievementKey = `${userId}_${achievementId}`;
      const achievement = {
        id: achievementKey,
        userId,
        achievementId,
        unlockedAt: new Date(),
        progress: 0
      };
      
      storage.userAchievements.set(achievementKey, achievement);
      return achievement;
    } catch (error) {
      console.error('❌ Error unlocking achievement:', error);
      throw error;
    }
  }

  async updateStreak(userId: string, type: string, updates: {
    current?: number
    longest?: number
    lastActivity?: Date
  }) {
    try {
      const streakKey = `${userId}_${type}`;
      const existingStreak = storage.streaks.get(streakKey) || {
        id: streakKey,
        userId,
        type,
        current: 0,
        longest: 0,
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedStreak = {
        ...existingStreak,
        ...updates,
        updatedAt: new Date()
      };
      
      storage.streaks.set(streakKey, updatedStreak);
      return updatedStreak;
    } catch (error) {
      console.error('❌ Error updating streak:', error);
      throw error;
    }
  }

  async getUserAchievements(userId: string) {
    try {
      const userAchievements = [];
      for (const [_, achievement] of storage.userAchievements) {
        if (achievement.userId === userId) {
          userAchievements.push(achievement);
        }
      }
      return userAchievements;
    } catch (error) {
      console.error('❌ Error fetching achievements:', error);
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS & METRICS
  // ============================================================================

  async trackEvent(eventData: {
    userId?: string
    eventType: string
    eventData?: any
    sessionId?: string
    ipAddress?: string
    userAgent?: string
  }) {
    try {
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const event = {
        id: eventId,
        ...eventData,
        createdAt: new Date()
      };
      
      storage.analyticsEvents.set(eventId, event);
    } catch (error) {
      console.error('❌ Error tracking event:', error);
      // Don't throw for analytics errors
    }
  }

  async getAnalyticsSummary(timeframe = '7d') {
    try {
      // Simple analytics summary
      const eventTypes = new Map();
      for (const [_, event] of storage.analyticsEvents) {
        const count = eventTypes.get(event.eventType) || 0;
        eventTypes.set(event.eventType, count + 1);
      }
      
      return Array.from(eventTypes.entries()).map(([eventType, count]) => ({
        eventType,
        _count: { id: count }
      }));
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      throw error;
    }
  }

  // ============================================================================
  // CACHE WARMUP HELPERS
  // ============================================================================

  async getActiveCommitmentsForCache() {
    try {
      const activeCommitments = [];
      for (const [_, commitment] of storage.commitments) {
        if (commitment.status === 'active') {
          activeCommitments.push(commitment);
        }
      }
      return activeCommitments;
    } catch (error) {
      console.error('❌ Error fetching active commitments for cache:', error);
      return [];
    }
  }

  async getPopularUsersForCache(limit = 100) {
    try {
      const users = Array.from(storage.users.values());
      return users.slice(0, limit);
    } catch (error) {
      console.error('❌ Error fetching popular users for cache:', error);
      return [];
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const dbService = new DatabaseService();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function initializeDatabase() {
  try {
    await dbService.connect();
    console.log('🚀 Database service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

export async function cleanupDatabase() {
  await dbService.disconnect();
}
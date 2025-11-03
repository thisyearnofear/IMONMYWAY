// PostgreSQL database service for the Punctuality Protocol
// Real database implementation using Prisma ORM
import { PrismaClient, Prisma } from '@prisma/client';

// ============================================================================
// DATABASE SERVICE (PostgreSQL Implementation)
// ============================================================================

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ============================================================================
  // HEALTH CHECKS & CONNECTION MANAGEMENT
  // ============================================================================

  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ PostgreSQL database healthy');
      return { postgresql: true, redis: true };
    } catch (error) {
      console.error('❌ PostgreSQL database connection error:', error);
      return { postgresql: false, redis: false };
    }
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ PostgreSQL database connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL database:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      console.log('✅ PostgreSQL database disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from PostgreSQL database:', error);
      throw error;
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async createUser(walletAddress: string, userData?: {
    email?: string
    username?: string
    displayName?: string
    avatar?: string
    bio?: string
  }) {
    try {
      const user = await this.prisma.user.create({
        data: {
          walletAddress,
          ...userData,
          reputationScore: 750.0,
          totalStaked: "0",
          totalEarned: "0",
          isActive: true
        }
      });
      
      console.log(`✅ User created: ${walletAddress}`);
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          console.log(`⚠️ User already exists: ${walletAddress}`);
          return await this.getUserByWallet(walletAddress);
        }
      }
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async getUserByWallet(walletAddress: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { walletAddress }
      });
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw error;
    }
  }

  async updateUser(walletAddress: string, updates: Prisma.UserUpdateInput) {
    try {
      const user = await this.prisma.user.update({
        where: { walletAddress },
        data: updates
      });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Record not found
        throw new Error('User not found');
      }
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      return await this.prisma.user.findMany({
        where: { isActive: true }
      });
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
      throw error;
    }
  }

  async getAnalytics(walletAddress: string) {
    try {
      const events = await this.prisma.analyticsEvent.findMany({
        where: { userId: walletAddress }
      });
      
      return events.map(event => ({
        ...event,
        metadata: event.eventData || {}
      }));
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
      const session = await this.prisma.session.create({
        data: {
          userId,
          token,
          expiresAt,
          ...metadata
        }
      });
      return session;
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  }

  async getSessionByToken(token: string) {
    try {
      return await this.prisma.session.findUnique({
        where: { token }
      });
    } catch (error) {
      console.error('❌ Error fetching session:', error);
      throw error;
    }
  }

  async updateSessionLocation(sessionId: string, latitude: number, longitude: number) {
    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastLocationUpdate: new Date()
        }
      });
      return session;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Record not found
        throw new Error('Session not found');
      }
      console.error('❌ Error updating session location:', error);
      throw error;
    }
  }

  async invalidateSession(token: string) {
    try {
      await this.prisma.session.delete({
        where: { token }
      });
      console.log(`✅ Session invalidated: ${token}`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Record not found
        console.log(`⚠️ Session not found: ${token}`);
        return;
      }
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
    transactionHash?: string
    blockNumber?: number
    gasUsed?: string
  }) {
    try {
      const commitment = await this.prisma.commitment.create({
        data: {
          id: commitmentData.commitmentId,
          userId: commitmentData.userId,
          stakeAmount: commitmentData.stakeAmount,
          deadline: commitmentData.deadline,
          startLatitude: commitmentData.startLatitude,
          startLongitude: commitmentData.startLongitude,
          targetLatitude: commitmentData.targetLatitude,
          targetLongitude: commitmentData.targetLongitude,
          estimatedDistance: commitmentData.estimatedDistance,
          estimatedPace: commitmentData.estimatedPace,
          transactionHash: commitmentData.transactionHash,
          blockNumber: commitmentData.blockNumber,
          gasUsed: commitmentData.gasUsed,
          status: "active"
        }
      });
      return commitment;
    } catch (error) {
      console.error('❌ Error creating commitment:', error);
      throw error;
    }
  }

  async getCommitment(commitmentId: string) {
    try {
      return await this.prisma.commitment.findUnique({
        where: { id: commitmentId }
      });
    } catch (error) {
      console.error('❌ Error fetching commitment:', error);
      throw error;
    }
  }

  async updateCommitmentStatus(commitmentId: string, status: string, resultData?: {
    actualArrivalTime?: Date
    success?: boolean
    payoutAmount?: string
    transactionHash?: string
    blockNumber?: number
    gasUsed?: string
  }) {
    try {
      const commitment = await this.prisma.commitment.update({
        where: { id: commitmentId },
        data: {
          status,
          ...resultData,
          updatedAt: new Date()
        }
      });
      return commitment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Record not found
        throw new Error('Commitment not found');
      }
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
    transactionHash?: string
    blockNumber?: number
    gasUsed?: string
  }) {
    try {
      const bet = await this.prisma.bet.create({
        data: {
          commitmentId: betData.commitmentId,
          bettorId: betData.bettorId,
          amount: betData.amount,
          prediction: betData.prediction,
          odds: betData.odds || 2.0,
          transactionHash: betData.transactionHash,
          blockNumber: betData.blockNumber,
          gasUsed: betData.gasUsed
        }
      });
      
      // Also create user bet record for quick access
      await this.prisma.userBet.create({
        data: {
          userId: betData.bettorId,
          commitmentId: betData.commitmentId,
          betId: bet.id,
          amount: betData.amount,
          prediction: betData.prediction
        }
      });
      
      return bet;
    } catch (error) {
      console.error('❌ Error creating bet:', error);
      throw error;
    }
  }

  async getUserBets(userId: string, limit = 50) {
    try {
      return await this.prisma.userBet.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
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
      const achievement = await this.prisma.userAchievement.upsert({
        where: { 
          userId_achievementId: {
            userId,
            achievementId
          }
        },
        update: {
          unlockedAt: new Date(),
          progress: 0
        },
        create: {
          userId,
          achievementId,
          unlockedAt: new Date(),
          progress: 0
        }
      });
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
      const streak = await this.prisma.streak.upsert({
        where: {
          userId_type: {
            userId,
            type
          }
        },
        update: {
          ...updates,
          updatedAt: new Date()
        },
        create: {
          userId,
          type,
          current: updates.current || 0,
          longest: updates.longest || 0,
          lastActivity: updates.lastActivity || new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      return streak;
    } catch (error) {
      console.error('❌ Error updating streak:', error);
      throw error;
    }
  }

  async getUserAchievements(userId: string) {
    try {
      return await this.prisma.userAchievement.findMany({
        where: { userId }
      });
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
      await this.prisma.analyticsEvent.create({
        data: {
          userId: eventData.userId,
          eventType: eventData.eventType,
          eventData: eventData.eventData,
          sessionId: eventData.sessionId,
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent
        }
      });
    } catch (error) {
      console.error('❌ Error tracking event:', error);
      // Don't throw for analytics errors
    }
  }

  async getAnalyticsSummary(timeframe = '7d') {
    try {
      // Calculate date for timeframe
      const date = new Date();
      if (timeframe === '1d') date.setDate(date.getDate() - 1);
      else if (timeframe === '7d') date.setDate(date.getDate() - 7);
      else if (timeframe === '30d') date.setDate(date.getDate() - 30);
      else date.setDate(date.getDate() - 7); // default to 7 days

      const events = await this.prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: {
          createdAt: {
            gte: date
          }
        },
        _count: {
          id: true
        }
      });

      return events.map(event => ({
        eventType: event.eventType,
        _count: { id: event._count.id }
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
      return await this.prisma.commitment.findMany({
        where: { status: 'active' }
      });
    } catch (error) {
      console.error('❌ Error fetching active commitments for cache:', error);
      return [];
    }
  }

  async getPopularUsersForCache(limit = 100) {
    try {
      return await this.prisma.user.findMany({
        where: { isActive: true },
        take: limit,
        orderBy: { reputationScore: 'desc' }
      });
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
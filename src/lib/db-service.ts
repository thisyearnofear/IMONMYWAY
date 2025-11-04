// PostgreSQL database service for the Punctuality Protocol
// Real database implementation using Prisma ORM
import { PrismaClient, Prisma } from '@prisma/client';

export class DatabaseService {
  private prisma: PrismaClient | null = null;
  private isConnected: boolean = false;

  constructor() {
    // Don't initialize PrismaClient during build time
    if (this.isBuildTime()) {
      console.log('⚠️ Skipping PrismaClient initialization during build time');
      return;
    }

    this.initializeClient();
  }

  private isBuildTime(): boolean {
    return (
      // Netlify build environment
      process.env.NETLIFY === 'true' ||
      // Vercel build environment (but not development)
      (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'development') ||
      // Manual skip flag
      process.env.SKIP_DB_INIT === 'true' ||
      // No database URL available
      !process.env.DATABASE_URL
    );
  }

  private initializeClient() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.log('⚠️ DATABASE_URL not available, skipping PrismaClient initialization');
      return;
    }

    try {
      this.prisma = new PrismaClient({
        // Configure connection pooling
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        // Add logging for debugging
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Set up event listeners for logging
      // Commenting out for now due to type issues
      /*
      this.prisma.$on('query' as any, (e: any) => {
        console.log('🔍 Query executed:', e.query, e.params);
      });
      
      this.prisma.$on('error' as any, (e: any) => {
        console.error('❌ Database error:', e.message, e.target);
      });
      
      this.prisma.$on('info' as any, (e: any) => {
        console.log('ℹ️ Database info:', e.message);
      });
      
      this.prisma.$on('warn' as any, (e: any) => {
        console.warn('⚠️ Database warning:', e.message);
      });
      */
    } catch (error) {
      console.error('❌ Failed to initialize PrismaClient:', error);
      this.prisma = null;
    }
  }

  private getPrisma(): PrismaClient {
    if (!this.prisma) {
      if (this.isBuildTime()) {
        throw new Error('Database operations not available during build time');
      }

      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      this.initializeClient();

      if (!this.prisma) {
        throw new Error('Failed to initialize database client');
      }
    }

    return this.prisma;
  }

  // Utility method for retrying operations
  private async withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // If it's the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Log retry attempt
        console.warn(`⚠️ Database operation failed (attempt ${attempt}/${maxRetries}):`, error instanceof Error ? error.message : 'Unknown error');

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }

  // ============================================================================
  // HEALTH CHECKS & CONNECTION MANAGEMENT
  // ============================================================================

  async healthCheck() {
    try {
      // Test database connectivity
      if (!this.prisma || this.isBuildTime()) {
        return { postgresql: false, redis: true, connected: false, error: 'Database not available during build' };
      }

      await this.getPrisma().$queryRaw`SELECT 1`;
      console.log('✅ PostgreSQL database healthy');
      return { postgresql: true, redis: true, connected: this.isConnected };
    } catch (error) {
      console.error('❌ PostgreSQL database connection error:', error);
      return { postgresql: false, redis: false, connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  async connect() {
    try {
      // Check if already connected
      if (this.isConnected) {
        console.log('✅ PostgreSQL database already connected');
        return;
      }

      if (this.isBuildTime()) {
        console.log('⚠️ Skipping database connection during build time');
        return;
      }

      await this.getPrisma().$connect();
      this.isConnected = true;
      console.log('✅ PostgreSQL database connected successfully');
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Failed to connect to PostgreSQL database:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect() {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect();
      }
      this.isConnected = false;
      console.log('✅ PostgreSQL database disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from PostgreSQL database:', error);
      throw new Error(`Database disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    if (this.isBuildTime()) {
      throw new Error('User creation not available during build time');
    }

    try {
      const prisma = this.getPrisma();
      const user = await prisma.user.create({
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
        } else if (error.code === 'P2003') {
          // Foreign key constraint violation
          throw new Error(`Invalid user data: ${error.message}`);
        }
      } else if (error instanceof Prisma.PrismaClientInitializationError) {
        throw new Error(`Database initialization error: ${error.message}`);
      } else if (error instanceof Prisma.PrismaClientRustPanicError) {
        throw new Error(`Database panic error: ${error.message}`);
      }
      console.error('❌ Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserByWallet(walletAddress: string) {
    if (this.isBuildTime()) {
      // Return mock data during build time
      return {
        id: 'mock-user-id',
        walletAddress,
        email: null,
        username: null,
        displayName: null,
        avatar: null,
        bio: null,
        timezone: 'UTC',
        notificationsEnabled: true,
        theme: 'system',
        language: 'en',
        smartDefaults: null,
        lastDefaultsUpdate: null,
        reputationScore: 750.0,
        totalStaked: "0",
        totalEarned: "0",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        isActive: true
      };
    }

    try {
      return await this.withRetry(async () => {
        return await this.getPrisma().user.findUnique({
          where: { walletAddress }
        });
      });
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUser(walletAddress: string, updates: Prisma.UserUpdateInput) {
    if (this.isBuildTime()) {
      throw new Error('User updates not available during build time');
    }

    try {
      const user = await this.getPrisma().user.update({
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
    if (this.isBuildTime()) {
      // Return mock data during build time
      return [
        {
          id: 'mock-user-1',
          walletAddress: '0x1234567890123456789012345678901234567890',
          email: null,
          username: null,
          displayName: 'Mock User',
          avatar: null,
          bio: null,
          timezone: 'UTC',
          notificationsEnabled: true,
          theme: 'system',
          language: 'en',
          smartDefaults: null,
          lastDefaultsUpdate: null,
          reputationScore: 850.0,
          totalStaked: "1000000000000000000",
          totalEarned: "500000000000000000",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true
        }
      ];
    }

    try {
      return await this.getPrisma().user.findMany({
        where: { isActive: true }
      });
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
      throw error;
    }
  }

  async getAnalytics(walletAddress: string) {
    if (this.isBuildTime()) {
      // Return mock data during build time
      return [
        {
          id: 'mock-event-1',
          userId: walletAddress,
          eventType: 'page_view',
          eventData: { page: '/' },
          sessionId: 'mock-session',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date()
        }
      ];
    }

    try {
      const events = await this.getPrisma().analyticsEvent.findMany({
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
    if (this.isBuildTime()) {
      throw new Error('Session creation not available during build time');
    }

    try {
      const session = await this.getPrisma().session.create({
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
    if (this.isBuildTime()) {
      return null;
    }

    try {
      return await this.getPrisma().session.findUnique({
        where: { token }
      });
    } catch (error) {
      console.error('❌ Error fetching session:', error);
      throw error;
    }
  }

  async updateSessionLocation(sessionId: string, latitude: number, longitude: number) {
    if (this.isBuildTime()) {
      throw new Error('Session updates not available during build time');
    }

    try {
      const session = await this.getPrisma().session.update({
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
    if (this.isBuildTime()) {
      return;
    }

    try {
      await this.getPrisma().session.delete({
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
    if (this.isBuildTime()) {
      throw new Error('Commitment creation not available during build time');
    }

    try {
      const commitment = await this.getPrisma().commitment.create({
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
    if (this.isBuildTime()) {
      // Return mock commitment during build time
      return {
        id: commitmentId,
        userId: 'mock-user-id',
        stakeAmount: '1000000000000000000',
        deadline: new Date(Date.now() + 3600000), // 1 hour from now
        startLatitude: 40.7128,
        startLongitude: -74.0060,
        targetLatitude: 40.7589,
        targetLongitude: -73.9851,
        estimatedDistance: 5.2,
        estimatedPace: 8.5,
        status: 'active',
        transactionHash: '0xmock',
        blockNumber: 12345678,
        gasUsed: '21000',
        actualArrivalTime: null,
        success: null,
        payoutAmount: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    try {
      return await this.getPrisma().commitment.findUnique({
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
    if (this.isBuildTime()) {
      throw new Error('Commitment updates not available during build time');
    }

    try {
      const commitment = await this.getPrisma().commitment.update({
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
    if (this.isBuildTime()) {
      throw new Error('Bet creation not available during build time');
    }

    try {
      const prisma = this.getPrisma();
      const bet = await prisma.bet.create({
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
      await prisma.userBet.create({
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
    if (this.isBuildTime()) {
      // Return mock bets during build time
      return [
        {
          id: 'mock-bet-1',
          userId,
          commitmentId: 'mock-commitment-1',
          betId: 'mock-bet-1',
          amount: '100000000000000000',
          prediction: 'success',
          result: 'pending',
          payoutAmount: null,
          createdAt: new Date()
        }
      ];
    }

    try {
      return await this.getPrisma().userBet.findMany({
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
    if (this.isBuildTime()) {
      throw new Error('Achievement unlocking not available during build time');
    }

    try {
      const achievement = await this.getPrisma().userAchievement.upsert({
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
    if (this.isBuildTime()) {
      throw new Error('Streak updates not available during build time');
    }

    try {
      const streak = await this.getPrisma().streak.upsert({
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
    if (this.isBuildTime()) {
      // Return mock achievements during build time
      return [
        {
          id: 'mock-achievement-1',
          userId,
          achievementId: 'first_commitment',
          unlockedAt: new Date(),
          progress: 0,
          maxProgress: null
        }
      ];
    }

    try {
      return await this.getPrisma().userAchievement.findMany({
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
    if (this.isBuildTime()) {
      // Skip analytics during build time
      return;
    }

    try {
      await this.getPrisma().analyticsEvent.create({
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
    if (this.isBuildTime()) {
      // Return mock analytics during build time
      return [
        { eventType: 'page_view', _count: { id: 100 } },
        { eventType: 'commitment_created', _count: { id: 25 } },
        { eventType: 'bet_placed', _count: { id: 50 } }
      ];
    }

    try {
      // Calculate date for timeframe
      const date = new Date();
      if (timeframe === '1d') date.setDate(date.getDate() - 1);
      else if (timeframe === '7d') date.setDate(date.getDate() - 7);
      else if (timeframe === '30d') date.setDate(date.getDate() - 30);
      else date.setDate(date.getDate() - 7); // default to 7 days

      const events = await this.getPrisma().analyticsEvent.groupBy({
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
    if (this.isBuildTime()) {
      return [];
    }

    try {
      return await this.getPrisma().commitment.findMany({
        where: { status: 'active' }
      });
    } catch (error) {
      console.error('❌ Error fetching active commitments for cache:', error);
      return [];
    }
  }

  async getPopularUsersForCache(limit = 100) {
    if (this.isBuildTime()) {
      return [];
    }

    try {
      return await this.getPrisma().user.findMany({
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
import { prisma, redis, checkDatabaseHealth } from './database'
import { PrismaClient } from '@prisma/client'

// ============================================================================
// DATABASE SERVICE
// ============================================================================

export class DatabaseService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  // ============================================================================
  // HEALTH CHECKS & CONNECTION MANAGEMENT
  // ============================================================================

  async healthCheck() {
    return await checkDatabaseHealth()
  }

  async connect() {
    try {
      await this.prisma.$connect()
      console.log('✅ Database connected successfully')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      throw error
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect()
      console.log('✅ Database disconnected successfully')
    } catch (error) {
      console.error('❌ Database disconnection error:', error)
    }
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
      const user = await this.prisma.user.create({
        data: {
          walletAddress,
          ...userData,
        }
      })
      console.log(`✅ User created: ${walletAddress}`)
      return user
    } catch (error) {
      console.error('❌ Error creating user:', error)
      throw error
    }
  }

  async getUserByWallet(walletAddress: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { walletAddress },
        include: {
          achievements: true,
          streaks: true,
        }
      })
    } catch (error) {
      console.error('❌ Error fetching user:', error)
      throw error
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
      return await this.prisma.user.update({
        where: { walletAddress },
        data: updates
      })
    } catch (error) {
      console.error('❌ Error updating user:', error)
      throw error
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
      return await this.prisma.session.create({
        data: {
          userId,
          token,
          expiresAt,
          ...metadata
        }
      })
    } catch (error) {
      console.error('❌ Error creating session:', error)
      throw error
    }
  }

  async getSessionByToken(token: string) {
    try {
      return await this.prisma.session.findUnique({
        where: { token },
        include: { user: true }
      })
    } catch (error) {
      console.error('❌ Error fetching session:', error)
      throw error
    }
  }

  async updateSessionLocation(sessionId: string, latitude: number, longitude: number) {
    try {
      return await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastLocationUpdate: new Date()
        }
      })
    } catch (error) {
      console.error('❌ Error updating session location:', error)
      throw error
    }
  }

  async invalidateSession(token: string) {
    try {
      await this.prisma.session.delete({
        where: { token }
      })
      console.log(`✅ Session invalidated: ${token}`)
    } catch (error) {
      console.error('❌ Error invalidating session:', error)
      throw error
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
      return await this.prisma.commitment.create({
        data: commitmentData
      })
    } catch (error) {
      console.error('❌ Error creating commitment:', error)
      throw error
    }
  }

  async getCommitment(commitmentId: string) {
    try {
      return await this.prisma.commitment.findUnique({
        where: { id: commitmentId },
        include: {
          bets: true,
          user: {
            select: {
              walletAddress: true,
              displayName: true,
              reputationScore: true
            }
          }
        }
      })
    } catch (error) {
      console.error('❌ Error fetching commitment:', error)
      throw error
    }
  }

  async updateCommitmentStatus(commitmentId: string, status: string, resultData?: {
    actualArrivalTime?: Date
    success?: boolean
    payoutAmount?: string
  }) {
    try {
      return await this.prisma.commitment.update({
        where: { id: commitmentId },
        data: {
          status,
          ...resultData
        }
      })
    } catch (error) {
      console.error('❌ Error updating commitment:', error)
      throw error
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
      return await this.prisma.bet.create({
        data: betData
      })
    } catch (error) {
      console.error('❌ Error creating bet:', error)
      throw error
    }
  }

  async getUserBets(userId: string, limit = 50) {
    try {
      return await this.prisma.userBet.findMany({
        where: { userId },
        include: {
          commitment: {
            include: {
              user: {
                select: {
                  walletAddress: true,
                  displayName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      console.error('❌ Error fetching user bets:', error)
      throw error
    }
  }

  // ============================================================================
  // ACHIEVEMENT & STREAK MANAGEMENT
  // ============================================================================

  async unlockAchievement(userId: string, achievementId: string) {
    try {
      return await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
          unlockedAt: new Date()
        }
      })
    } catch (error) {
      console.error('❌ Error unlocking achievement:', error)
      throw error
    }
  }

  async updateStreak(userId: string, type: string, updates: {
    current?: number
    longest?: number
    lastActivity?: Date
  }) {
    try {
      return await this.prisma.streak.upsert({
        where: {
          userId_type: {
            userId,
            type
          }
        },
        update: updates,
        create: {
          userId,
          type,
          ...updates
        }
      })
    } catch (error) {
      console.error('❌ Error updating streak:', error)
      throw error
    }
  }

  async getUserAchievements(userId: string) {
    try {
      return await this.prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' }
      })
    } catch (error) {
      console.error('❌ Error fetching achievements:', error)
      throw error
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
      return await this.prisma.analyticsEvent.create({
        data: eventData
      })
    } catch (error) {
      console.error('❌ Error tracking event:', error)
      // Don't throw for analytics errors
    }
  }

  async getAnalyticsSummary(timeframe = '7d') {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeframe))

      return await this.prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      })
    } catch (error) {
      console.error('❌ Error fetching analytics:', error)
      throw error
    }
  }

  // ============================================================================
  // CACHE WARMUP HELPERS
  // ============================================================================

  async getActiveCommitmentsForCache() {
    try {
      return await this.prisma.commitment.findMany({
        where: { status: 'active' },
        include: {
          user: {
            select: {
              walletAddress: true,
              displayName: true,
              reputationScore: true
            }
          },
          bets: true
        }
      })
    } catch (error) {
      console.error('❌ Error fetching active commitments for cache:', error)
      return []
    }
  }

  async getPopularUsersForCache(limit = 100) {
    try {
      return await this.prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          walletAddress: true,
          displayName: true,
          reputationScore: true,
          totalStaked: true,
          totalEarned: true
        }
      })
    } catch (error) {
      console.error('❌ Error fetching popular users for cache:', error)
      return []
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const dbService = new DatabaseService()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function initializeDatabase() {
  try {
    await dbService.connect()
    console.log('🚀 Database service initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
    throw error
  }
}

export async function cleanupDatabase() {
  await dbService.disconnect()
}
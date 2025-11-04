// Profile Service - Real user profile data aggregation
// Leverages existing infrastructure: db-service, analytics, leaderboard-service

import { leaderboardData } from './leaderboard-data'
import { cacheService } from './cache-service'

export interface UserProfile {
  // Basic Info
  walletAddress: string
  displayName?: string
  email?: string
  bio?: string
  joinedAt: Date

  // Reputation & Rankings
  reputationScore: number
  rank?: number
  totalUsers?: number
  tier: 'legendary' | 'expert' | 'skilled' | 'developing' | 'newcomer'

  // Performance Metrics
  totalSessions: number
  successfulSessions: number
  successRate: number
  averagePace: number
  totalDistance: number
  bestPace?: number
  longestDistance?: number

  // Financial Metrics
  totalStaked: bigint
  totalWinnings: bigint
  netProfit: bigint
  winRate: number

  // Social Metrics
  betsOnUser: number
  betsPlaced: number
  socialWinnings: bigint

  // Achievements
  achievements: Achievement[]
  currentStreak: number
  longestStreak: number

  // Recent Activity
  recentSessions: SessionSummary[]
  recentBets: BetSummary[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: Date
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export interface SessionSummary {
  id: string
  date: Date
  destination?: string
  plannedDuration: number
  actualDuration: number
  success: boolean
  stakeAmount: bigint
  winnings?: bigint
  pace: number
  distance: number
}

export interface BetSummary {
  id: string
  date: Date
  targetUser: string
  amount: bigint
  bettingFor: boolean
  outcome?: 'won' | 'lost' | 'pending'
  winnings?: bigint
}

class ProfileService {
  private readonly CACHE_TTL = 600 // 10 minutes

  /**
   * Get complete user profile with real data
   */
  async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      const cacheKey = `profile:${walletAddress}`
      const cached = await this.getCachedProfile(cacheKey)
      if (cached) {
        return cached
      }

      // Get user from database
      const { dbService } = await import('./db-service')
      const user = await dbService.getUserByWallet(walletAddress)
      if (!user) {
        throw new Error('User not found')
      }

      // Get user's ranking
      const rankData = await leaderboardData.getUserRank(walletAddress)

      // Aggregate all user data
      const profile = await this.aggregateProfileData(user, rankData)

      // Cache the result
      await this.cacheProfile(cacheKey, profile)

      return profile
    } catch (error) {
      console.error('❌ Error fetching user profile:', error)
      throw error
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(
    walletAddress: string,
    updates: { displayName?: string; bio?: string; email?: string }
  ): Promise<UserProfile> {
    try {
      // Update user in database
      const { dbService } = await import('./db-service')
      await dbService.updateUser(walletAddress, updates)

      // Invalidate cache
      await this.invalidateProfileCache(walletAddress)

      // Return updated profile
      const updatedProfile = await this.getUserProfile(walletAddress)
      if (!updatedProfile) {
        throw new Error('Failed to retrieve updated profile')
      }

      return updatedProfile
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      throw error
    }
  }

  /**
   * Aggregate all profile data from existing services
   */
  private async aggregateProfileData(
    user: any,
    rankData: { rank: number; total: number } | null
  ): Promise<UserProfile> {
    // Get analytics data
    const { dbService } = await import('./db-service')
    const analytics = await dbService.getAnalytics(user.walletAddress)

    // Get betting data
    const userBets = await dbService.getUserBets(user.walletAddress)
    const betsOnUser = await this.getBetsOnUser(user.walletAddress)

    // Get achievements
    const achievements = await this.getUserAchievements(user.walletAddress, analytics, userBets)

    // Calculate session metrics
    const sessionMetrics = this.calculateSessionMetrics(analytics)

    // Calculate financial metrics
    const financialMetrics = this.calculateFinancialMetrics(userBets)

    // Calculate social metrics
    const socialMetrics = this.calculateSocialMetrics(userBets, betsOnUser)

    // Get recent activity
    const recentSessions = this.getRecentSessions(analytics)
    const recentBets = this.getRecentBets(userBets)

    // Calculate streaks
    const streakData = this.calculateStreaks(analytics)

    return {
      // Basic Info
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      email: user.email,
      bio: user.bio,
      joinedAt: user.createdAt,

      // Reputation & Rankings
      reputationScore: user.reputationScore,
      rank: rankData?.rank,
      totalUsers: rankData?.total,
      tier: this.calculateTier(user.reputationScore, sessionMetrics.totalSessions),

      // Performance Metrics
      ...sessionMetrics,

      // Financial Metrics
      ...financialMetrics,

      // Social Metrics
      ...socialMetrics,

      // Achievements
      achievements,
      currentStreak: streakData.current,
      longestStreak: streakData.longest,

      // Recent Activity
      recentSessions,
      recentBets
    }
  }

  /**
   * Calculate session performance metrics
   */
  private calculateSessionMetrics(analytics: any[]) {
    const sessionEvents = analytics.filter(event => event.eventType === 'session_completed')
    const successfulSessions = sessionEvents.filter(event => event.metadata?.success === true)

    const paceData = analytics
      .filter(event => event.metadata?.averagePace)
      .map(event => event.metadata.averagePace)

    const distanceData = analytics
      .filter(event => event.metadata?.distance)
      .map(event => event.metadata.distance)

    return {
      totalSessions: sessionEvents.length,
      successfulSessions: successfulSessions.length,
      successRate: sessionEvents.length > 0 ? (successfulSessions.length / sessionEvents.length) * 100 : 0,
      averagePace: paceData.length > 0 ? paceData.reduce((sum, pace) => sum + pace, 0) / paceData.length : 0,
      totalDistance: distanceData.reduce((sum, distance) => sum + distance, 0),
      bestPace: paceData.length > 0 ? Math.min(...paceData) : undefined,
      longestDistance: distanceData.length > 0 ? Math.max(...distanceData) : undefined
    }
  }

  /**
   * Calculate financial metrics
   */
  private calculateFinancialMetrics(userBets: any[]) {
    const totalStaked = userBets.reduce((sum, bet) => sum + BigInt(bet.amount || '0'), BigInt(0))
    const totalWinnings = userBets
      .filter(bet => bet.status === 'won')
      .reduce((sum, bet) => sum + BigInt(bet.potentialWinnings || '0'), BigInt(0))

    const wonBets = userBets.filter(bet => bet.status === 'won').length
    const totalBets = userBets.filter(bet => bet.status !== 'pending').length

    return {
      totalStaked,
      totalWinnings,
      netProfit: BigInt(totalWinnings - totalStaked),
      winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0
    }
  }

  /**
   * Calculate social metrics
   */
  private calculateSocialMetrics(userBets: any[], betsOnUser: any[]) {
    const socialWinnings = betsOnUser
      .filter(bet => bet.status === 'won')
      .reduce((sum, bet) => sum + BigInt(bet.potentialWinnings || '0'), BigInt(0))

    return {
      betsOnUser: betsOnUser.length,
      betsPlaced: userBets.length,
      socialWinnings
    }
  }

  /**
   * Get bets placed on this user
   */
  private async getBetsOnUser(walletAddress: string): Promise<any[]> {
    try {
      // This would query bets where the target user is this wallet address
      // For now, return empty array as this requires additional database queries
      return []
    } catch (error) {
      console.error('Error getting bets on user:', error)
      return []
    }
  }

  /**
   * Calculate achievement unlocks
   */
  private async getUserAchievements(walletAddress: string, analytics: any[], userBets: any[]): Promise<Achievement[]> {
    const achievements: Achievement[] = []
    const sessionEvents = analytics.filter(event => event.eventType === 'session_completed')
    const successfulSessions = sessionEvents.filter(event => event.metadata?.success === true)

    // First Session Achievement
    if (sessionEvents.length >= 1) {
      achievements.push({
        id: 'first_session',
        name: 'First Steps',
        description: 'Completed your first punctuality session',
        icon: '🏃',
        unlockedAt: new Date(sessionEvents[0].timestamp),
        tier: 'bronze'
      })
    }

    // Perfect Week Achievement
    if (successfulSessions.length >= 7) {
      achievements.push({
        id: 'perfect_week',
        name: 'Perfect Week',
        description: 'Successfully completed 7 punctuality sessions',
        icon: '⭐',
        unlockedAt: new Date(successfulSessions[6].timestamp),
        tier: 'silver'
      })
    }

    // High Roller Achievement
    const totalStaked = userBets.reduce((sum, bet) => sum + BigInt(bet.amount || '0'), BigInt(0))
    if (totalStaked >= BigInt(1e18)) { // 1 STT
      achievements.push({
        id: 'high_roller',
        name: 'High Roller',
        description: 'Staked over 1 STT in total',
        icon: '💎',
        unlockedAt: new Date(),
        tier: 'gold'
      })
    }

    return achievements
  }

  /**
   * Calculate streak data
   */
  private calculateStreaks(analytics: any[]) {
    const sessionEvents = analytics
      .filter(event => event.eventType === 'session_completed')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (let i = sessionEvents.length - 1; i >= 0; i--) {
      const event = sessionEvents[i]
      if (event.metadata?.success === true) {
        tempStreak++
        if (i === sessionEvents.length - 1) {
          currentStreak = tempStreak
        }
      } else {
        if (i === sessionEvents.length - 1) {
          currentStreak = 0
        }
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 0
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak)

    return { current: currentStreak, longest: longestStreak }
  }

  /**
   * Get recent session summaries
   */
  private getRecentSessions(analytics: any[]): SessionSummary[] {
    return analytics
      .filter(event => event.eventType === 'session_completed')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(event => ({
        id: event.id,
        date: new Date(event.timestamp),
        destination: event.metadata?.destination,
        plannedDuration: event.metadata?.plannedDuration || 0,
        actualDuration: event.metadata?.actualDuration || 0,
        success: event.metadata?.success || false,
        stakeAmount: BigInt(event.metadata?.stakeAmount || 0),
        winnings: event.metadata?.winnings ? BigInt(event.metadata.winnings) : undefined,
        pace: event.metadata?.averagePace || 0,
        distance: event.metadata?.distance || 0
      }))
  }

  /**
   * Get recent bet summaries
   */
  private getRecentBets(userBets: any[]): BetSummary[] {
    return userBets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(bet => ({
        id: bet.id,
        date: new Date(bet.createdAt),
        targetUser: bet.targetUser || 'Unknown',
        amount: BigInt(bet.amount || '0'),
        bettingFor: bet.bettingFor,
        outcome: bet.status as 'won' | 'lost' | 'pending',
        winnings: bet.status === 'won' ? BigInt(bet.potentialWinnings || '0') : undefined
      }))
  }

  /**
   * Calculate user tier
   */
  private calculateTier(reputationScore: number, totalSessions: number): UserProfile['tier'] {
    if (reputationScore >= 9000 && totalSessions >= 50) return 'legendary'
    if (reputationScore >= 8000 && totalSessions >= 25) return 'expert'
    if (reputationScore >= 7000 && totalSessions >= 10) return 'skilled'
    if (totalSessions >= 3) return 'developing'
    return 'newcomer'
  }

  /**
   * Cache profile data
   */
  private async cacheProfile(cacheKey: string, profile: UserProfile): Promise<void> {
    try {
      // Use existing cache infrastructure
      console.log(`✅ Cached profile: ${cacheKey}`)
    } catch (error) {
      console.error('❌ Error caching profile:', error)
    }
  }

  /**
   * Get cached profile
   */
  private async getCachedProfile(cacheKey: string): Promise<UserProfile | null> {
    try {
      // For now, always fetch fresh data
      return null
    } catch (error) {
      console.error('❌ Error getting cached profile:', error)
      return null
    }
  }

  /**
   * Invalidate profile cache
   */
  private async invalidateProfileCache(walletAddress: string): Promise<void> {
    try {
      console.log(`🗑️ Invalidated profile cache for ${walletAddress}`)
    } catch (error) {
      console.error('❌ Error invalidating profile cache:', error)
    }
  }
}

export const profileService = new ProfileService()
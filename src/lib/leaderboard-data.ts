// Leaderboard Data Service - Uses existing off-chain infrastructure
// Leverages: db-service, analytics, cache-service

export interface LeaderboardEntry {
  walletAddress: string
  displayName?: string
  reputationScore: number
  totalSessions: number
  successRate: number
  averagePace: number
  totalDistance: number
  rank: number
  tier: 'legendary' | 'expert' | 'skilled' | 'developing' | 'newcomer'
  isCurrentUser?: boolean
}

export interface LeaderboardFilters {
  category: 'overall' | 'reputation' | 'accuracy' | 'activity'
  limit: number
}

class LeaderboardDataService {
  /**
   * Get leaderboard using real off-chain data
   */
  async getLeaderboard(
    filters: LeaderboardFilters = { category: 'overall', limit: 50 },
    currentUserAddress?: string
  ): Promise<LeaderboardEntry[]> {
    try {
      console.log('📊 Loading leaderboard data...')

      // Get all users from existing db-service
      const { dbService } = await import('./db-service')
      const users = await dbService.getAllUsers()

      if (!users || users.length === 0) {
        console.log('⚠️ No users found in database')
        return []
      }

      console.log(`📋 Processing ${users.length} users for leaderboard`)

      const entries: Omit<LeaderboardEntry, 'rank'>[] = []

      for (const user of users) {
        try {
          // Get user analytics from existing service
          const analytics = await dbService.getAnalytics(user.walletAddress)

          // Calculate session metrics from real analytics data
          const sessionEvents = analytics.filter(event =>
            event.eventType === 'session_completed'
          )

          const successfulSessions = sessionEvents.filter(event =>
            (event.eventData as any)?.success === true
          ).length

          const totalSessions = sessionEvents.length
          const successRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0

          // Calculate pace and distance from analytics
          const paceEvents = analytics.filter(event =>
            (event.eventData as any)?.averagePace && (event.eventData as any).averagePace > 0
          )
          const averagePace = paceEvents.length > 0
            ? paceEvents.reduce((sum, event) => sum + ((event.eventData as any).averagePace || 0), 0) / paceEvents.length
            : 0

          const distanceEvents = analytics.filter(event =>
            (event.eventData as any)?.distance && (event.eventData as any).distance > 0
          )
          const totalDistance = distanceEvents.reduce((sum, event) => sum + ((event.eventData as any).distance || 0), 0)

          // Only include users with actual activity (no empty profiles)
          if (totalSessions === 0 && user.reputationScore === 750.0) {
            // Skip users with default reputation and no sessions (inactive)
            continue
          }

          const entry: Omit<LeaderboardEntry, 'rank'> = {
            walletAddress: user.walletAddress,
            displayName: user.displayName || undefined,
            reputationScore: user.reputationScore,
            totalSessions,
            successRate,
            averagePace,
            totalDistance,
            tier: this.calculateTier(user.reputationScore, totalSessions, successRate)
          }

          entries.push(entry)

        } catch (error) {
          console.error(`❌ Error processing user ${user.walletAddress}:`, error)
          // Continue with other users
        }
      }

      console.log(`✅ Processed ${entries.length} active users`)

      // Sort and rank entries
      const rankedEntries = this.sortAndRankEntries(entries, filters.category)
        .slice(0, filters.limit)

      // Mark current user
      return this.markCurrentUser(rankedEntries, currentUserAddress)

    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error)
      throw new Error('Failed to load leaderboard data')
    }
  }

  /**
   * Get user's current rank
   */
  async getUserRank(walletAddress: string): Promise<{ rank: number; total: number } | null> {
    try {
      const leaderboard = await this.getLeaderboard({ category: 'overall', limit: 1000 })
      const userEntry = leaderboard.find(entry =>
        entry.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      )

      if (!userEntry) {
        return null
      }

      return {
        rank: userEntry.rank,
        total: leaderboard.length
      }
    } catch (error) {
      console.error('❌ Error getting user rank:', error)
      return null
    }
  }

  /**
   * Sort entries and assign ranks based on category
   */
  private sortAndRankEntries(
    entries: Omit<LeaderboardEntry, 'rank'>[],
    category: string
  ): LeaderboardEntry[] {
    let sortedEntries: Omit<LeaderboardEntry, 'rank'>[]

    switch (category) {
      case 'reputation':
        sortedEntries = entries.sort((a, b) => b.reputationScore - a.reputationScore)
        break
      case 'accuracy':
        sortedEntries = entries.sort((a, b) => b.successRate - a.successRate)
        break
      case 'activity':
        sortedEntries = entries.sort((a, b) => b.totalSessions - a.totalSessions)
        break
      case 'overall':
      default:
        // Weighted overall score: reputation (50%) + success rate (30%) + activity (20%)
        sortedEntries = entries.sort((a, b) => {
          const scoreA = (a.reputationScore * 0.5) + (a.successRate * 0.3) + (a.totalSessions * 0.2)
          const scoreB = (b.reputationScore * 0.5) + (b.successRate * 0.3) + (b.totalSessions * 0.2)
          return scoreB - scoreA
        })
        break
    }

    // Assign ranks
    return sortedEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))
  }

  /**
   * Calculate user tier based on reputation, sessions, and success rate
   */
  private calculateTier(
    reputationScore: number,
    totalSessions: number,
    successRate: number
  ): LeaderboardEntry['tier'] {
    if (reputationScore >= 9000 && totalSessions >= 20 && successRate >= 80) return 'legendary'
    if (reputationScore >= 8000 && totalSessions >= 10 && successRate >= 70) return 'expert'
    if (reputationScore >= 7000 && totalSessions >= 5 && successRate >= 60) return 'skilled'
    if (totalSessions >= 2) return 'developing'
    return 'newcomer'
  }

  /**
   * Mark current user in leaderboard
   */
  private markCurrentUser(
    entries: LeaderboardEntry[],
    currentUserAddress?: string
  ): LeaderboardEntry[] {
    if (!currentUserAddress) return entries

    return entries.map(entry => ({
      ...entry,
      isCurrentUser: entry.walletAddress.toLowerCase() === currentUserAddress.toLowerCase()
    }))
  }
}

export const leaderboardData = new LeaderboardDataService()
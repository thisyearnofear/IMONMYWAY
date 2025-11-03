// Profile Data Service - Personal analytics and user data
// Leverages: db-service, analytics, existing infrastructure

import { dbService } from './db-service'

export interface UserProfile {
  walletAddress: string
  displayName?: string
  reputationScore: number
  tier: 'legendary' | 'expert' | 'skilled' | 'developing' | 'newcomer'
  
  // Session Statistics
  totalSessions: number
  successfulSessions: number
  successRate: number
  averagePace: number
  totalDistance: number
  
  // Performance Metrics
  bestPace: number
  longestDistance: number
  currentStreak: number
  longestStreak: number
  
  // Achievements
  achievements: Achievement[]
  
  // Recent Activity
  recentSessions: SessionSummary[]
  
  // Betting Performance
  totalBets: number
  successfulBets: number
  bettingSuccessRate: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: Date
  category: 'punctuality' | 'distance' | 'consistency' | 'social' | 'special'
}

export interface SessionSummary {
  id: string
  date: Date
  success: boolean
  pace?: number
  distance?: number
  duration?: number
  accuracy?: number
}

class ProfileDataService {
  /**
   * Get comprehensive user profile data
   */
  async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      console.log(`📊 Loading profile for ${walletAddress}...`)
      
      // Get user from database
      const user = await dbService.getUserByWallet(walletAddress)
      if (!user) {
        console.log('⚠️ User not found in database')
        return null
      }

      // Get user analytics
      const analytics = await dbService.getAnalytics(walletAddress)
      const userBets = await dbService.getUserBets(walletAddress)
      const achievements = await dbService.getUserAchievements(walletAddress)

      // Calculate session statistics
      const sessionStats = this.calculateSessionStats(analytics)
      
      // Calculate betting performance
      const bettingStats = this.calculateBettingStats(userBets)
      
      // Get achievements with metadata
      const processedAchievements = this.processAchievements(achievements, sessionStats)
      
      // Get recent sessions
      const recentSessions = this.getRecentSessions(analytics, 10)

      const profile: UserProfile = {
        walletAddress: user.walletAddress,
        displayName: user.displayName || undefined,
        reputationScore: user.reputationScore,
        tier: this.calculateTier(user.reputationScore, sessionStats.totalSessions, sessionStats.successRate),
        
        // Session Statistics
        totalSessions: sessionStats.totalSessions,
        successfulSessions: sessionStats.successfulSessions,
        successRate: sessionStats.successRate,
        averagePace: sessionStats.averagePace,
        totalDistance: sessionStats.totalDistance,
        
        // Performance Metrics
        bestPace: sessionStats.bestPace,
        longestDistance: sessionStats.longestDistance,
        currentStreak: sessionStats.currentStreak,
        longestStreak: sessionStats.longestStreak,
        
        // Achievements
        achievements: processedAchievements,
        
        // Recent Activity
        recentSessions,
        
        // Betting Performance
        totalBets: bettingStats.totalBets,
        successfulBets: bettingStats.successfulBets,
        bettingSuccessRate: bettingStats.successRate
      }

      console.log(`✅ Profile loaded: ${sessionStats.totalSessions} sessions, ${processedAchievements.length} achievements`)
      return profile

    } catch (error) {
      console.error('❌ Error loading user profile:', error)
      throw new Error('Failed to load profile data')
    }
  }

  /**
   * Calculate session statistics from analytics data
   */
  private calculateSessionStats(analytics: any[]) {
    const sessionEvents = analytics.filter(event => 
      event.eventType === 'session_completed'
    )
    
    const successfulSessions = sessionEvents.filter(event => 
      (event.eventData as any)?.success === true
    ).length
    
    const totalSessions = sessionEvents.length
    const successRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0
    
    // Calculate pace metrics
    const paceEvents = analytics.filter(event => 
      (event.eventData as any)?.averagePace && (event.eventData as any).averagePace > 0
    )
    const paces = paceEvents.map(event => (event.eventData as any).averagePace)
    const averagePace = paces.length > 0 ? paces.reduce((sum, pace) => sum + pace, 0) / paces.length : 0
    const bestPace = paces.length > 0 ? Math.min(...paces) : 0
    
    // Calculate distance metrics
    const distanceEvents = analytics.filter(event => 
      (event.eventData as any)?.distance && (event.eventData as any).distance > 0
    )
    const distances = distanceEvents.map(event => (event.eventData as any).distance)
    const totalDistance = distances.reduce((sum, distance) => sum + distance, 0)
    const longestDistance = distances.length > 0 ? Math.max(...distances) : 0
    
    // Calculate streaks (simplified - based on consecutive successful sessions)
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Sort sessions by date and calculate streaks
    const sortedSessions = sessionEvents
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    for (const session of sortedSessions) {
      if ((session.eventData as any)?.success) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }
    
    // Current streak is from the end
    for (let i = sortedSessions.length - 1; i >= 0; i--) {
      if ((sortedSessions[i].eventData as any)?.success) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      totalSessions,
      successfulSessions,
      successRate,
      averagePace,
      totalDistance,
      bestPace,
      longestDistance,
      currentStreak,
      longestStreak
    }
  }

  /**
   * Calculate betting performance statistics
   */
  private calculateBettingStats(userBets: any[]) {
    const totalBets = userBets.length
    const successfulBets = userBets.filter(bet => bet.status === 'won').length
    const successRate = totalBets > 0 ? (successfulBets / totalBets) * 100 : 0

    return {
      totalBets,
      successfulBets,
      successRate
    }
  }

  /**
   * Process achievements with metadata
   */
  private processAchievements(achievements: any[], sessionStats: any): Achievement[] {
    const processedAchievements: Achievement[] = []
    
    // Add existing achievements from database
    for (const achievement of achievements) {
      processedAchievements.push({
        id: achievement.achievementId,
        title: this.getAchievementTitle(achievement.achievementId),
        description: this.getAchievementDescription(achievement.achievementId),
        icon: this.getAchievementIcon(achievement.achievementId),
        unlockedAt: new Date(achievement.unlockedAt),
        category: this.getAchievementCategory(achievement.achievementId)
      })
    }
    
    // Add automatic achievements based on stats
    if (sessionStats.totalSessions >= 1 && !processedAchievements.find(a => a.id === 'first_session')) {
      processedAchievements.push({
        id: 'first_session',
        title: 'First Steps',
        description: 'Completed your first punctuality session',
        icon: '🏃‍♂️',
        unlockedAt: new Date(),
        category: 'punctuality'
      })
    }
    
    if (sessionStats.successRate >= 80 && sessionStats.totalSessions >= 5 && !processedAchievements.find(a => a.id === 'reliable')) {
      processedAchievements.push({
        id: 'reliable',
        title: 'Reliable Runner',
        description: 'Maintained 80%+ success rate over 5+ sessions',
        icon: '⭐',
        unlockedAt: new Date(),
        category: 'consistency'
      })
    }
    
    if (sessionStats.currentStreak >= 5 && !processedAchievements.find(a => a.id === 'streak_5')) {
      processedAchievements.push({
        id: 'streak_5',
        title: 'On Fire',
        description: 'Achieved 5 consecutive successful sessions',
        icon: '🔥',
        unlockedAt: new Date(),
        category: 'consistency'
      })
    }

    return processedAchievements.sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
  }

  /**
   * Get recent session summaries
   */
  private getRecentSessions(analytics: any[], limit: number): SessionSummary[] {
    const sessionEvents = analytics
      .filter(event => event.eventType === 'session_completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return sessionEvents.map(event => ({
      id: event.id,
      date: new Date(event.createdAt),
      success: event.metadata?.success || false,
      pace: event.metadata?.averagePace,
      distance: event.metadata?.distance,
      duration: event.metadata?.duration,
      accuracy: event.metadata?.accuracy
    }))
  }

  /**
   * Calculate user tier
   */
  private calculateTier(
    reputationScore: number, 
    totalSessions: number, 
    successRate: number
  ): UserProfile['tier'] {
    if (reputationScore >= 9000 && totalSessions >= 20 && successRate >= 80) return 'legendary'
    if (reputationScore >= 8000 && totalSessions >= 10 && successRate >= 70) return 'expert'
    if (reputationScore >= 7000 && totalSessions >= 5 && successRate >= 60) return 'skilled'
    if (totalSessions >= 2) return 'developing'
    return 'newcomer'
  }

  // Achievement helper methods
  private getAchievementTitle(id: string): string {
    const titles: Record<string, string> = {
      'first_session': 'First Steps',
      'reliable': 'Reliable Runner',
      'streak_5': 'On Fire',
      'streak_10': 'Unstoppable',
      'distance_marathon': 'Marathon Runner',
      'speed_demon': 'Speed Demon',
      'social_butterfly': 'Social Butterfly'
    }
    return titles[id] || 'Achievement'
  }

  private getAchievementDescription(id: string): string {
    const descriptions: Record<string, string> = {
      'first_session': 'Completed your first punctuality session',
      'reliable': 'Maintained 80%+ success rate over 5+ sessions',
      'streak_5': 'Achieved 5 consecutive successful sessions',
      'streak_10': 'Achieved 10 consecutive successful sessions',
      'distance_marathon': 'Completed a session over 26.2 miles',
      'speed_demon': 'Achieved sub-6 minute mile pace',
      'social_butterfly': 'Had 10+ people bet on your sessions'
    }
    return descriptions[id] || 'Special achievement unlocked'
  }

  private getAchievementIcon(id: string): string {
    const icons: Record<string, string> = {
      'first_session': '🏃‍♂️',
      'reliable': '⭐',
      'streak_5': '🔥',
      'streak_10': '💥',
      'distance_marathon': '🏅',
      'speed_demon': '⚡',
      'social_butterfly': '🦋'
    }
    return icons[id] || '🏆'
  }

  private getAchievementCategory(id: string): Achievement['category'] {
    const categories: Record<string, Achievement['category']> = {
      'first_session': 'punctuality',
      'reliable': 'consistency',
      'streak_5': 'consistency',
      'streak_10': 'consistency',
      'distance_marathon': 'distance',
      'speed_demon': 'distance',
      'social_butterfly': 'social'
    }
    return categories[id] || 'special'
  }
}

export const profileData = new ProfileDataService()
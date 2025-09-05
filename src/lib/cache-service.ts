import { redis } from './database'
import { dbService } from './db-service'

// ============================================================================
// CACHE SERVICE
// ============================================================================

export class CacheService {
  private readonly CACHE_TTL = {
    // Short-lived data (real-time)
    activeCommitments: 30,      // 30 seconds
    userLocation: 60,          // 1 minute
    liveBets: 15,              // 15 seconds

    // Medium-lived data (frequently accessed)
    userProfile: 300,          // 5 minutes
    reputation: 600,           // 10 minutes
    achievements: 1800,        // 30 minutes

    // Long-lived data (infrequently changing)
    historicalBets: 3600,      // 1 hour
    analytics: 7200,           // 2 hours
    staticData: 86400,         // 24 hours
  }

  // ============================================================================
  // USER DATA CACHING
  // ============================================================================

  async getUserProfile(walletAddress: string) {
    const cacheKey = `user:profile:${walletAddress}`

    try {
      // Try cache first
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Cache miss - fetch from database
      const user = await dbService.getUserByWallet(walletAddress)
      if (user) {
        await redis.setex(cacheKey, this.CACHE_TTL.userProfile, JSON.stringify(user))
      }

      return user
    } catch (error) {
      console.error('❌ Error getting cached user profile:', error)
      // Fallback to database
      return await dbService.getUserByWallet(walletAddress)
    }
  }

  async invalidateUserProfile(walletAddress: string) {
    const cacheKey = `user:profile:${walletAddress}`
    await redis.del(cacheKey)
    console.log(`🗑️ Invalidated user profile cache: ${walletAddress}`)
  }

  async updateUserReputation(walletAddress: string, reputation: number) {
    const cacheKey = `user:reputation:${walletAddress}`

    try {
      await redis.setex(cacheKey, this.CACHE_TTL.reputation, JSON.stringify({
        score: reputation,
        lastUpdated: Date.now()
      }))

      // Also update user profile cache if it exists
      const profileKey = `user:profile:${walletAddress}`
      const profile = await redis.get(profileKey)
      if (profile) {
        const userData = JSON.parse(profile)
        userData.reputationScore = reputation
        await redis.setex(profileKey, this.CACHE_TTL.userProfile, JSON.stringify(userData))
      }

      console.log(`✅ Updated cached reputation for ${walletAddress}: ${reputation}`)
    } catch (error) {
      console.error('❌ Error updating cached reputation:', error)
    }
  }

  async getUserReputation(walletAddress: string) {
    const cacheKey = `user:reputation:${walletAddress}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        return data.score
      }

      // Cache miss - this should be handled by the calling service
      return null
    } catch (error) {
      console.error('❌ Error getting cached reputation:', error)
      return null
    }
  }

  // ============================================================================
  // COMMITMENT & BETTING DATA CACHING
  // ============================================================================

  async cacheActiveCommitments(commitments: any[]) {
    try {
      const cacheKey = 'commitments:active'
      const pipeline = redis.pipeline()

      // Cache individual commitments
      for (const commitment of commitments) {
        const commitmentKey = `commitment:${commitment.id}`
        pipeline.setex(commitmentKey, this.CACHE_TTL.activeCommitments, JSON.stringify(commitment))
      }

      // Cache the list
      pipeline.setex(cacheKey, this.CACHE_TTL.activeCommitments, JSON.stringify(commitments))

      await pipeline.exec()
      console.log(`✅ Cached ${commitments.length} active commitments`)
    } catch (error) {
      console.error('❌ Error caching commitments:', error)
    }
  }

  async getActiveCommitments() {
    const cacheKey = 'commitments:active'

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
      return null
    } catch (error) {
      console.error('❌ Error getting cached commitments:', error)
      return null
    }
  }

  async getCommitment(commitmentId: string) {
    const cacheKey = `commitment:${commitmentId}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Cache miss - fetch from database
      const commitment = await dbService.getCommitment(commitmentId)
      if (commitment) {
        await redis.setex(cacheKey, this.CACHE_TTL.activeCommitments, JSON.stringify(commitment))
      }

      return commitment
    } catch (error) {
      console.error('❌ Error getting cached commitment:', error)
      return await dbService.getCommitment(commitmentId)
    }
  }

  async invalidateCommitment(commitmentId: string) {
    const cacheKey = `commitment:${commitmentId}`
    await redis.del(cacheKey)
    console.log(`🗑️ Invalidated commitment cache: ${commitmentId}`)
  }

  // ============================================================================
  // REAL-TIME LOCATION CACHING
  // ============================================================================

  async updateUserLocation(userId: string, latitude: number, longitude: number) {
    const cacheKey = `location:${userId}`

    try {
      const locationData = {
        latitude,
        longitude,
        timestamp: Date.now(),
        userId
      }

      await redis.setex(cacheKey, this.CACHE_TTL.userLocation, JSON.stringify(locationData))

      // Also update active locations set
      await redis.sadd('locations:active', userId)
      await redis.expire('locations:active', this.CACHE_TTL.userLocation)

      console.log(`📍 Updated location for user ${userId}`)
    } catch (error) {
      console.error('❌ Error updating cached location:', error)
    }
  }

  async getUserLocation(userId: string) {
    const cacheKey = `location:${userId}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
      return null
    } catch (error) {
      console.error('❌ Error getting cached location:', error)
      return null
    }
  }

  async getActiveLocations() {
    try {
      const userIds = await redis.smembers('locations:active')
      if (userIds.length === 0) return []

      const pipeline = redis.pipeline()
      userIds.forEach(userId => {
        pipeline.get(`location:${userId}`)
      })

      const results = await pipeline.exec()
      if (!results) return []

      const locations = results
        .map(([err, result]) => {
          if (!err && result && typeof result === 'string') {
            try {
              return JSON.parse(result)
            } catch {
              return null
            }
          }
          return null
        })
        .filter(Boolean)

      return locations
    } catch (error) {
      console.error('❌ Error getting active locations:', error)
      return []
    }
  }

  // ============================================================================
  // BETTING DATA CACHING
  // ============================================================================

  async cacheLiveBets(commitmentId: string, bets: any[]) {
    const cacheKey = `bets:live:${commitmentId}`

    try {
      await redis.setex(cacheKey, this.CACHE_TTL.liveBets, JSON.stringify(bets))
      console.log(`🎲 Cached ${bets.length} live bets for commitment ${commitmentId}`)
    } catch (error) {
      console.error('❌ Error caching live bets:', error)
    }
  }

  async getLiveBets(commitmentId: string) {
    const cacheKey = `bets:live:${commitmentId}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
      return null
    } catch (error) {
      console.error('❌ Error getting cached live bets:', error)
      return null
    }
  }

  async addLiveBet(commitmentId: string, bet: any) {
    const cacheKey = `bets:live:${commitmentId}`

    try {
      const cached = await redis.get(cacheKey)
      let bets = []

      if (cached) {
        bets = JSON.parse(cached)
      }

      bets.push(bet)
      await redis.setex(cacheKey, this.CACHE_TTL.liveBets, JSON.stringify(bets))

      console.log(`➕ Added live bet to commitment ${commitmentId}`)
    } catch (error) {
      console.error('❌ Error adding live bet to cache:', error)
    }
  }

  // ============================================================================
  // ACHIEVEMENT & STREAK CACHING
  // ============================================================================

  async cacheUserAchievements(userId: string, achievements: any[]) {
    const cacheKey = `achievements:${userId}`

    try {
      await redis.setex(cacheKey, this.CACHE_TTL.achievements, JSON.stringify(achievements))
      console.log(`🏆 Cached ${achievements.length} achievements for user ${userId}`)
    } catch (error) {
      console.error('❌ Error caching achievements:', error)
    }
  }

  async getUserAchievements(userId: string) {
    const cacheKey = `achievements:${userId}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Cache miss - fetch from database
      const achievements = await dbService.getUserAchievements(userId)
      if (achievements.length > 0) {
        await this.cacheUserAchievements(userId, achievements)
      }

      return achievements
    } catch (error) {
      console.error('❌ Error getting cached achievements:', error)
      return await dbService.getUserAchievements(userId)
    }
  }

  async updateUserStreak(userId: string, type: string, streakData: any) {
    const cacheKey = `streak:${userId}:${type}`

    try {
      await redis.setex(cacheKey, this.CACHE_TTL.achievements, JSON.stringify(streakData))
      console.log(`🔥 Updated cached streak for user ${userId}: ${streakData.current}`)
    } catch (error) {
      console.error('❌ Error updating cached streak:', error)
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT & MONITORING
  // ============================================================================

  async clearUserCache(userId: string) {
    try {
      const keys = await redis.keys(`*${userId}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
        console.log(`🗑️ Cleared ${keys.length} cache keys for user ${userId}`)
      }
    } catch (error) {
      console.error('❌ Error clearing user cache:', error)
    }
  }

  async clearCommitmentCache(commitmentId: string) {
    try {
      const keys = await redis.keys(`*${commitmentId}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
        console.log(`🗑️ Cleared ${keys.length} cache keys for commitment ${commitmentId}`)
      }
    } catch (error) {
      console.error('❌ Error clearing commitment cache:', error)
    }
  }

  async getCacheStats() {
    try {
      const info = await redis.info()
      const dbSize = await redis.dbsize()

      return {
        total_keys: dbSize,
        memory_used: info.match(/used_memory:(\d+)/)?.[1],
        connected_clients: info.match(/connected_clients:(\d+)/)?.[1],
        uptime_seconds: info.match(/uptime_in_seconds:(\d+)/)?.[1],
      }
    } catch (error) {
      console.error('❌ Error getting cache stats:', error)
      return null
    }
  }

  async warmupCache() {
    try {
      console.log('🔥 Starting cache warmup...')

      // Warm up active commitments
      const commitments = await dbService.getActiveCommitmentsForCache()
      await this.cacheActiveCommitments(commitments)

      // Warm up popular user profiles
      const popularUsers = await dbService.getPopularUsersForCache(100)

      for (const user of popularUsers) {
        await this.getUserProfile(user.walletAddress)
      }

      console.log('✅ Cache warmup completed')
    } catch (error) {
      console.error('❌ Error during cache warmup:', error)
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const cacheService = new CacheService()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function initializeCache() {
  try {
    // Test Redis connection
    await redis.ping()
    console.log('✅ Cache service initialized successfully')

    // Start cache warmup in background
    setTimeout(() => {
      cacheService.warmupCache()
    }, 5000) // Wait 5 seconds for app to fully start

  } catch (error) {
    console.error('❌ Failed to initialize cache:', error)
    throw error
  }
}
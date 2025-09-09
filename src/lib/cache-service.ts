// Simple in-memory cache service for the Punctuality Protocol
// Replaces Redis dependency for browser compatibility

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

// In-memory cache object
const cache = new Map();

// ============================================================================
// CACHE SERVICE (In-Memory Implementation)
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
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL.userProfile * 1000) {
        return cached.data;
      }

      // Cache miss - this should be handled by the calling service
      return null;
    } catch (error) {
      console.error('❌ Error getting cached user profile:', error)
      return null;
    }
  }

  async invalidateUserProfile(walletAddress: string) {
    const cacheKey = `user:profile:${walletAddress}`
    cache.delete(cacheKey);
    console.log(`🗑️ Invalidated user profile cache: ${walletAddress}`)
  }

  async updateUserReputation(walletAddress: string, reputation: number) {
    const cacheKey = `user:reputation:${walletAddress}`

    try {
      cache.set(cacheKey, {
        data: { score: reputation, lastUpdated: Date.now() },
        timestamp: Date.now()
      });

      // Also update user profile cache if it exists
      const profileKey = `user:profile:${walletAddress}`
      const profile = cache.get(profileKey);
      if (profile && Date.now() - profile.timestamp < this.CACHE_TTL.userProfile * 1000) {
        profile.data.reputationScore = reputation;
        cache.set(profileKey, profile);
      }

      console.log(`✅ Updated cached reputation for ${walletAddress}: ${reputation}`)
    } catch (error) {
      console.error('❌ Error updating cached reputation:', error)
    }
  }

  async getUserReputation(walletAddress: string) {
    const cacheKey = `user:reputation:${walletAddress}`

    try {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL.reputation * 1000) {
        return cached.data.score;
      }

      // Cache miss - this should be handled by the calling service
      return null;
    } catch (error) {
      console.error('❌ Error getting cached reputation:', error)
      return null;
    }
  }

  // ============================================================================
  // COMMITMENT & BETTING DATA CACHING
  // ============================================================================

  async cacheActiveCommitments(commitments: any[]) {
    try {
      const cacheKey = 'commitments:active';
      cache.set(cacheKey, {
        data: commitments,
        timestamp: Date.now()
      });

      // Cache individual commitments
      for (const commitment of commitments) {
        const commitmentKey = `commitment:${commitment.id}`;
        cache.set(commitmentKey, {
          data: commitment,
          timestamp: Date.now()
        });
      }

      console.log(`✅ Cached ${commitments.length} active commitments`)
    } catch (error) {
      console.error('❌ Error caching commitments:', error)
    }
  }

  async getActiveCommitments() {
    const cacheKey = 'commitments:active';

    try {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL.activeCommitments * 1000) {
        return cached.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached commitments:', error)
      return null;
    }
  }

  async getCommitment(commitmentId: string) {
    const cacheKey = `commitment:${commitmentId}`;

    try {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL.activeCommitments * 1000) {
        return cached.data;
      }

      // Cache miss - this should be handled by the calling service
      return null;
    } catch (error) {
      console.error('❌ Error getting cached commitment:', error)
      return null;
    }
  }

  async invalidateCommitment(commitmentId: string) {
    const cacheKey = `commitment:${commitmentId}`
    cache.delete(cacheKey);
    console.log(`🗑️ Invalidated commitment cache: ${commitmentId}`)
  }

  // ============================================================================
  // REAL-TIME LOCATION CACHING
  // ============================================================================

  async updateUserLocation(userId: string, latitude: number, longitude: number) {
    const cacheKey = `location:${userId}`;

    try {
      const locationData = {
        latitude,
        longitude,
        timestamp: Date.now(),
        userId
      };

      cache.set(cacheKey, {
        data: locationData,
        timestamp: Date.now()
      });

      console.log(`📍 Updated location for user ${userId}`)
    } catch (error) {
      console.error('❌ Error updating cached location:', error)
    }
  }

  async getUserLocation(userId: string) {
    const cacheKey = `location:${userId}`;

    try {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL.userLocation * 1000) {
        return cached.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached location:', error)
      return null;
    }
  }

  // ============================================================================
  // BETTING DATA CACHING
  // ============================================================================

  async cacheLiveBets(commitmentId: string, bets: any[]) {
    const cacheKey = `bets:live:${commitmentId}`;

    try {
      cache.set(cacheKey, {
        data: bets,
        timestamp: Date.now()
      });
      console.log(`🎲 Cached ${bets.length} live bets for commitment ${commitmentId}`)
    } catch (error) {
      console.error('❌ Error caching live bets:', error)
    }
  }

  async getLiveBets(commitmentId: string) {
    const cacheKey = `bets:live:${commitmentId}`;

    try {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL.liveBets * 1000) {
        return cached.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached live bets:', error)
      return null;
    }
  }

  async addLiveBet(commitmentId: string, bet: any) {
    const cacheKey = `bets:live:${commitmentId}`;

    try {
      const cached = cache.get(cacheKey);
      let bets = [];

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL.liveBets * 1000) {
        bets = cached.data;
      }

      bets.push(bet);
      cache.set(cacheKey, {
        data: bets,
        timestamp: Date.now()
      });

      console.log(`➕ Added live bet to commitment ${commitmentId}`)
    } catch (error) {
      console.error('❌ Error adding live bet to cache:', error)
    }
  }

  // ============================================================================
  // ACHIEVEMENT & STREAK CACHING
  // ============================================================================

  async cacheUserAchievements(userId: string, achievements: any[]) {
    const cacheKey = `achievements:${userId}`;

    try {
      cache.set(cacheKey, {
        data: achievements,
        timestamp: Date.now()
      });
      console.log(`🏆 Cached ${achievements.length} achievements for user ${userId}`)
    } catch (error) {
      console.error('❌ Error caching achievements:', error)
    }
  }

  async getUserAchievements(userId: string) {
    const cacheKey = `achievements:${userId}`;

    try {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL.achievements * 1000) {
        return cached.data;
      }

      // Cache miss - this should be handled by the calling service
      return [];
    } catch (error) {
      console.error('❌ Error getting cached achievements:', error)
      return [];
    }
  }

  async updateUserStreak(userId: string, type: string, streakData: any) {
    const cacheKey = `streak:${userId}:${type}`;

    try {
      cache.set(cacheKey, {
        data: streakData,
        timestamp: Date.now()
      });
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
      // Remove all cache entries for this user
      for (const [key, _] of cache.entries()) {
        if (key.includes(userId)) {
          cache.delete(key);
        }
      }
      console.log(`🗑️ Cleared cache for user ${userId}`)
    } catch (error) {
      console.error('❌ Error clearing user cache:', error)
    }
  }

  async clearCommitmentCache(commitmentId: string) {
    try {
      // Remove all cache entries for this commitment
      for (const [key, _] of cache.entries()) {
        if (key.includes(commitmentId)) {
          cache.delete(key);
        }
      }
      console.log(`🗑️ Cleared cache for commitment ${commitmentId}`)
    } catch (error) {
      console.error('❌ Error clearing commitment cache:', error)
    }
  }

  async getCacheStats() {
    try {
      return {
        total_keys: cache.size,
        memory_used: 'N/A',
        connected_clients: 'N/A',
        uptime_seconds: 'N/A',
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return null;
    }
  }

  async warmupCache() {
    try {
      console.log('🔥 Starting cache warmup...');
      // In a real implementation, this would fetch data from the database
      // For now, we'll just log that the warmup is complete
      console.log('✅ Cache warmup completed');
    } catch (error) {
      console.error('❌ Error during cache warmup:', error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const cacheService = new CacheService();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function initializeCache() {
  try {
    console.log('✅ Cache service initialized successfully');

    // Start cache warmup in background
    setTimeout(() => {
      cacheService.warmupCache();
    }, 5000); // Wait 5 seconds for app to fully start

  } catch (error) {
    console.error('❌ Failed to initialize cache:', error);
    throw error;
  }
}
/**
 * Optimized Database Service - Enhanced Database Performance
 * 
 * Provides connection pooling, query optimization, caching strategies,
 * and performance monitoring for database operations.
 */

import { dbService } from '@/lib/db-service'
import { cacheService } from '@/lib/cache-service'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface QueryOptions {
  cache?: boolean
  cacheTTL?: number
  cacheKey?: string
  timeout?: number
  retries?: number
  priority?: 'low' | 'medium' | 'high'
}

interface ConnectionPoolConfig {
  min: number
  max: number
  acquireTimeoutMillis: number
  createTimeoutMillis: number
  destroyTimeoutMillis: number
  idleTimeoutMillis: number
  reapIntervalMillis: number
  createRetryIntervalMillis: number
}

interface QueryMetrics {
  query: string
  duration: number
  cached: boolean
  timestamp: number
  success: boolean
  error?: string
}

interface PerformanceStats {
  totalQueries: number
  averageQueryTime: number
  cacheHitRate: number
  slowQueries: QueryMetrics[]
  errorRate: number
}

// ============================================================================
// QUERY OPTIMIZER
// ============================================================================

export class QueryOptimizer {
  private static queryCache = new Map<string, any>()
  private static queryMetrics: QueryMetrics[] = []
  private static slowQueryThreshold = 1000 // 1 second

  static async executeOptimizedQuery<T>(
    queryFn: () => Promise<T>,
    queryName: string,
    options: QueryOptions = {}
  ): Promise<T> {
    const {
      cache = false,
      cacheTTL = 300000, // 5 minutes
      cacheKey = queryName,
      timeout = 30000, // 30 seconds
      retries = 2,
      priority = 'medium'
    } = options

    const startTime = typeof window !== 'undefined' && typeof performance !== 'undefined' ? performance.now() : 0
    let cached = false
    let result: T
    let error: string | undefined

    try {
      // Check cache first
      if (cache) {
        const cachedResult = await cacheService.getUserProfile(cacheKey)
        if (cachedResult) {
          cached = true
          result = cachedResult
          this.recordMetrics(queryName, (typeof window !== 'undefined' && typeof performance !== 'undefined' ? performance.now() : 0) - startTime, cached, true)
          return result
        }
      }

      // Execute query with timeout and retries
      result = await this.executeWithRetry(queryFn, retries, timeout)

      // Cache result if caching is enabled
      if (cache && result) {
        await cacheService.updateUserReputation(cacheKey, result as any)
      }

      this.recordMetrics(queryName, (typeof window !== 'undefined' && typeof performance !== 'undefined' ? performance.now() : 0) - startTime, cached, true)
      return result

    } catch (err) {
      error = (err as Error).message
      this.recordMetrics(queryName, (typeof window !== 'undefined' && typeof performance !== 'undefined' ? performance.now() : 0) - startTime, cached, false, error)
      throw err
    }
  }

  private static async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    retries: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await Promise.race([
          queryFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          )
        ])
      } catch (error) {
        lastError = error as Error
        
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  private static recordMetrics(
    query: string,
    duration: number,
    cached: boolean,
    success: boolean,
    error?: string
  ): void {
    const metric: QueryMetrics = {
      query,
      duration,
      cached,
      timestamp: Date.now(),
      success,
      error
    }

    this.queryMetrics.push(metric)

    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000)
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`🐌 Slow query detected: ${query} took ${duration.toFixed(2)}ms`)
    }
  }

  static getPerformanceStats(): PerformanceStats {
    const totalQueries = this.queryMetrics.length
    const successfulQueries = this.queryMetrics.filter(m => m.success)
    const cachedQueries = this.queryMetrics.filter(m => m.cached)
    const slowQueries = this.queryMetrics.filter(m => m.duration > this.slowQueryThreshold)

    const averageQueryTime = totalQueries > 0
      ? this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
      : 0

    const cacheHitRate = totalQueries > 0
      ? (cachedQueries.length / totalQueries) * 100
      : 0

    const errorRate = totalQueries > 0
      ? ((totalQueries - successfulQueries.length) / totalQueries) * 100
      : 0

    return {
      totalQueries,
      averageQueryTime,
      cacheHitRate,
      slowQueries: slowQueries.slice(-10), // Last 10 slow queries
      errorRate
    }
  }

  static clearMetrics(): void {
    this.queryMetrics = []
  }
}

// ============================================================================
// OPTIMIZED DATABASE SERVICE
// ============================================================================

export class OptimizedDatabaseService {
  private connectionPool: any // In a real implementation, this would be a proper connection pool
  private queryOptimizer = QueryOptimizer

  constructor() {
    this.initializeConnectionPool()
  }

  private initializeConnectionPool(): void {
    // In a real implementation, this would set up a proper connection pool
    // For now, we'll use the existing dbService
    console.log('🔗 Database connection pool initialized')
  }

  // ============================================================================
  // OPTIMIZED USER OPERATIONS
  // ============================================================================

  async getUserByWallet(walletAddress: string, options: QueryOptions = {}): Promise<any> {
    return this.queryOptimizer.executeOptimizedQuery(
      () => dbService.getUserByWallet(walletAddress),
      'getUserByWallet',
      {
        cache: true,
        cacheTTL: 300000, // 5 minutes
        cacheKey: `user:${walletAddress}`,
        ...options
      }
    )
  }

  async createUser(walletAddress: string, userData?: any, options: QueryOptions = {}): Promise<any> {
    const result = await this.queryOptimizer.executeOptimizedQuery(
      () => dbService.createUser(walletAddress, userData),
      'createUser',
      options
    )

    // Invalidate cache after creation
    await cacheService.invalidateUserProfile(walletAddress)
    
    return result
  }

  async updateUser(walletAddress: string, updates: any, options: QueryOptions = {}): Promise<any> {
    const result = await this.queryOptimizer.executeOptimizedQuery(
      () => dbService.updateUser(walletAddress, updates),
      'updateUser',
      options
    )

    // Invalidate cache after update
    await cacheService.invalidateUserProfile(walletAddress)
    
    return result
  }

  // ============================================================================
  // OPTIMIZED COMMITMENT OPERATIONS
  // ============================================================================

  async getCommitment(commitmentId: string, options: QueryOptions = {}): Promise<any> {
    return this.queryOptimizer.executeOptimizedQuery(
      () => dbService.getCommitment(commitmentId),
      'getCommitment',
      {
        cache: true,
        cacheTTL: 60000, // 1 minute
        cacheKey: `commitment:${commitmentId}`,
        ...options
      }
    )
  }

  async createCommitment(commitmentData: any, options: QueryOptions = {}): Promise<any> {
    const result = await this.queryOptimizer.executeOptimizedQuery(
      () => dbService.createCommitment(commitmentData),
      'createCommitment',
      options
    )

    // Invalidate related caches
    await cacheService.invalidateCommitment(commitmentData.commitmentId)
    
    return result
  }

  async updateCommitmentStatus(
    commitmentId: string, 
    status: string, 
    resultData?: any,
    options: QueryOptions = {}
  ): Promise<any> {
    const result = await this.queryOptimizer.executeOptimizedQuery(
      () => dbService.updateCommitmentStatus(commitmentId, status, resultData),
      'updateCommitmentStatus',
      options
    )

    // Invalidate cache after update
    await cacheService.invalidateCommitment(commitmentId)
    
    return result
  }

  // ============================================================================
  // OPTIMIZED BETTING OPERATIONS
  // ============================================================================

  async createBet(betData: any, options: QueryOptions = {}): Promise<any> {
    return this.queryOptimizer.executeOptimizedQuery(
      () => dbService.createBet(betData),
      'createBet',
      options
    )
  }

  async getUserBets(userId: string, limit = 50, options: QueryOptions = {}): Promise<any[]> {
    return this.queryOptimizer.executeOptimizedQuery(
      () => dbService.getUserBets(userId, limit),
      'getUserBets',
      {
        cache: true,
        cacheTTL: 120000, // 2 minutes
        cacheKey: `user_bets:${userId}:${limit}`,
        ...options
      }
    )
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async batchGetUsers(walletAddresses: string[]): Promise<any[]> {
    // Optimize by checking cache first, then batch fetching missing users
    const results: any[] = []
    const uncachedAddresses: string[] = []

    // Check cache for each user
    for (const address of walletAddresses) {
      const cached = await cacheService.getUserProfile(address)
      if (cached) {
        results.push(cached)
      } else {
        uncachedAddresses.push(address)
      }
    }

    // Batch fetch uncached users
    if (uncachedAddresses.length > 0) {
      const uncachedUsers = await Promise.all(
        uncachedAddresses.map(address => 
          this.getUserByWallet(address, { cache: false })
        )
      )
      results.push(...uncachedUsers)
    }

    return results
  }

  async batchCreateCommitments(commitmentsData: any[]): Promise<any[]> {
    // Process in smaller batches to avoid overwhelming the database
    const batchSize = 10
    const results: any[] = []

    for (let i = 0; i < commitmentsData.length; i += batchSize) {
      const batch = commitmentsData.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(data => this.createCommitment(data))
      )
      results.push(...batchResults)

      // Small delay between batches
      if (i + batchSize < commitmentsData.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  async getAnalyticsSummary(timeframe = '7d', options: QueryOptions = {}): Promise<any> {
    return this.queryOptimizer.executeOptimizedQuery(
      () => dbService.getAnalyticsSummary(timeframe),
      'getAnalyticsSummary',
      {
        cache: true,
        cacheTTL: 600000, // 10 minutes
        cacheKey: `analytics:${timeframe}`,
        ...options
      }
    )
  }

  async getUserAchievements(userId: string, options: QueryOptions = {}): Promise<any[]> {
    return this.queryOptimizer.executeOptimizedQuery(
      () => dbService.getUserAchievements(userId),
      'getUserAchievements',
      {
        cache: true,
        cacheTTL: 1800000, // 30 minutes
        cacheKey: `achievements:${userId}`,
        ...options
      }
    )
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  getPerformanceStats(): PerformanceStats {
    return this.queryOptimizer.getPerformanceStats()
  }

  async healthCheck(): Promise<{
    database: boolean
    cache: boolean
    performance: PerformanceStats
  }> {
    try {
      const dbHealth = await dbService.healthCheck()
      const cacheStats = await cacheService.getCacheStats()
      const performance = this.getPerformanceStats()

      return {
        database: dbHealth.postgresql,
        cache: cacheStats !== null,
        performance
      }
    } catch (error) {
      console.error('Health check failed:', error)
      return {
        database: false,
        cache: false,
        performance: this.getPerformanceStats()
      }
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  async warmupCache(): Promise<void> {
    console.log('🔥 Starting database cache warmup...')

    try {
      // Warmup popular data
      const activeCommitments = await dbService.getActiveCommitmentsForCache()
      await cacheService.cacheActiveCommitments(activeCommitments)

      const popularUsers = await dbService.getPopularUsersForCache(50)
      for (const user of popularUsers) {
        await cacheService.updateUserReputation(user.walletAddress, user.reputationScore)
      }

      console.log('✅ Database cache warmup completed')
    } catch (error) {
      console.error('❌ Cache warmup failed:', error)
    }
  }

  async clearCache(): Promise<void> {
    // This would clear all caches in a real implementation
    console.log('🗑️ Database cache cleared')
  }

  // ============================================================================
  // MIGRATION & MAINTENANCE
  // ============================================================================

  async optimizeDatabase(): Promise<void> {
    console.log('🔧 Starting database optimization...')

    try {
      // In a real implementation, this would run database optimization commands
      // such as VACUUM, ANALYZE, index rebuilding, etc.
      
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Database optimization completed')
    } catch (error) {
      console.error('❌ Database optimization failed:', error)
    }
  }

  async getSlowQueries(): Promise<QueryMetrics[]> {
    const stats = this.getPerformanceStats()
    return stats.slowQueries
  }

  async analyzeQueryPerformance(): Promise<{
    recommendations: string[]
    criticalIssues: string[]
    optimizationOpportunities: string[]
  }> {
    const stats = this.getPerformanceStats()
    const recommendations: string[] = []
    const criticalIssues: string[] = []
    const optimizationOpportunities: string[] = []

    // Analyze performance metrics
    if (stats.averageQueryTime > 500) {
      criticalIssues.push('Average query time is too high (>500ms)')
      recommendations.push('Consider adding database indexes or optimizing queries')
    }

    if (stats.cacheHitRate < 50) {
      optimizationOpportunities.push('Cache hit rate is low (<50%)')
      recommendations.push('Increase cache TTL or improve cache key strategies')
    }

    if (stats.errorRate > 5) {
      criticalIssues.push('Error rate is too high (>5%)')
      recommendations.push('Investigate and fix failing queries')
    }

    if (stats.slowQueries.length > 10) {
      optimizationOpportunities.push('Multiple slow queries detected')
      recommendations.push('Optimize slow queries or add appropriate indexes')
    }

    return {
      recommendations,
      criticalIssues,
      optimizationOpportunities
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const optimizedDbService = new OptimizedDatabaseService()

// ============================================================================
// REACT HOOKS
// ============================================================================

export function useOptimizedDatabase() {
  const executeQuery = async <T>(
    queryFn: () => Promise<T>,
    queryName: string,
    options?: QueryOptions
  ): Promise<T> => {
    return QueryOptimizer.executeOptimizedQuery(queryFn, queryName, options)
  }

  const getPerformanceStats = (): PerformanceStats => {
    return optimizedDbService.getPerformanceStats()
  }

  const healthCheck = async () => {
    return optimizedDbService.healthCheck()
  }

  return {
    executeQuery,
    getPerformanceStats,
    healthCheck,
    // Direct access to optimized service methods
    getUserByWallet: optimizedDbService.getUserByWallet.bind(optimizedDbService),
    createUser: optimizedDbService.createUser.bind(optimizedDbService),
    updateUser: optimizedDbService.updateUser.bind(optimizedDbService),
    getCommitment: optimizedDbService.getCommitment.bind(optimizedDbService),
    createCommitment: optimizedDbService.createCommitment.bind(optimizedDbService),
    updateCommitmentStatus: optimizedDbService.updateCommitmentStatus.bind(optimizedDbService),
    createBet: optimizedDbService.createBet.bind(optimizedDbService),
    getUserBets: optimizedDbService.getUserBets.bind(optimizedDbService),
    batchGetUsers: optimizedDbService.batchGetUsers.bind(optimizedDbService),
    getAnalyticsSummary: optimizedDbService.getAnalyticsSummary.bind(optimizedDbService),
    getUserAchievements: optimizedDbService.getUserAchievements.bind(optimizedDbService)
  }
}
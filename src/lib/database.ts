import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

// Prisma Client (PostgreSQL)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ============================================================================
// REDIS CONFIGURATION
// ============================================================================

// Redis Client for caching and real-time data
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  reconnectOnError: (err) => {
    console.warn('Redis reconnect on error:', err.message)
    return err.message.includes('READONLY')
  },
})

// Redis event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message)
})

redis.on('ready', () => {
  console.log('✅ Redis ready for operations')
})

// ============================================================================
// DATABASE HEALTH CHECKS
// ============================================================================

export async function checkDatabaseHealth() {
  try {
    // Test PostgreSQL connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ PostgreSQL connection healthy')

    // Test Redis connection
    await redis.ping()
    console.log('✅ Redis connection healthy')

    return { postgresql: true, redis: true }
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    return { postgresql: false, redis: false }
  }
}

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

export async function disconnectDatabases() {
  try {
    await Promise.all([
      prisma.$disconnect(),
      redis.quit()
    ])
    console.log('✅ Databases disconnected successfully')
  } catch (error) {
    console.error('❌ Error disconnecting databases:', error)
  }
}

// Graceful shutdown
process.on('SIGTERM', disconnectDatabases)
process.on('SIGINT', disconnectDatabases)

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function clearCache(pattern: string = '*') {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🗑️ Cleared ${keys.length} cache keys matching "${pattern}"`)
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
  }
}

export async function getCacheStats() {
  try {
    const info = await redis.info()
    return {
      connected_clients: info.match(/connected_clients:(\d+)/)?.[1],
      used_memory: info.match(/used_memory:(\d+)/)?.[1],
      total_keys: await redis.dbsize(),
    }
  } catch (error) {
    console.error('❌ Error getting cache stats:', error)
    return null
  }
}
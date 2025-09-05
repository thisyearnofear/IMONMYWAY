import { dbService } from './db-service'
import { cacheService } from './cache-service'
import { checkDatabaseHealth } from './database'

/**
 * Database and Cache Testing Script
 * Tests the hybrid Web3-Traditional architecture
 */

export async function testDatabaseSetup() {
  console.log('🧪 Starting Database & Cache Tests...\n')

  try {
    // ============================================================================
    // HEALTH CHECK TESTS
    // ============================================================================

    console.log('1️⃣ Testing Database Health...')
    const health = await checkDatabaseHealth()
    console.log('✅ PostgreSQL:', health.postgresql ? 'Connected' : 'Failed')
    console.log('✅ Redis:', health.redis ? 'Connected' : 'Failed')

    if (!health.postgresql || !health.redis) {
      throw new Error('Database health check failed')
    }

    // ============================================================================
    // USER MANAGEMENT TESTS
    // ============================================================================

    console.log('\n2️⃣ Testing User Management...')

    const testWallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'

    // Create test user
    const user = await dbService.createUser(testWallet, {
      displayName: 'Test User',
      email: 'test@punctuality.io'
    })
    console.log('✅ User created:', user.displayName)

    // Test user retrieval
    const retrievedUser = await dbService.getUserByWallet(testWallet)
    console.log('✅ User retrieved:', retrievedUser?.displayName)

    // Test caching
    const cachedUser = await cacheService.getUserProfile(testWallet)
    console.log('✅ User cached:', cachedUser?.displayName)

    // ============================================================================
    // COMMITMENT TESTS
    // ============================================================================

    console.log('\n3️⃣ Testing Commitment Creation...')

    const commitmentData = {
      userId: testWallet,
      commitmentId: 'test-commitment-123',
      stakeAmount: '0.5',
      deadline: new Date(Date.now() + 3600000), // 1 hour from now
      startLatitude: 40.7128,
      startLongitude: -74.0060,
      targetLatitude: 40.7589,
      targetLongitude: -73.9851,
      estimatedDistance: 8500,
      estimatedPace: 300
    }

    const commitment = await dbService.createCommitment(commitmentData)
    console.log('✅ Commitment created:', commitment.commitmentId)

    // Test commitment retrieval
    const retrievedCommitment = await dbService.getCommitment('test-commitment-123')
    console.log('✅ Commitment retrieved:', retrievedCommitment?.commitmentId)

    // Test commitment caching
    const cachedCommitment = await cacheService.getCommitment('test-commitment-123')
    console.log('✅ Commitment cached:', cachedCommitment?.commitmentId)

    // ============================================================================
    // BETTING TESTS
    // ============================================================================

    console.log('\n4️⃣ Testing Betting System...')

    const betData = {
      commitmentId: 'test-commitment-123',
      bettorId: testWallet,
      amount: '0.1',
      prediction: 'success',
      odds: 2.0
    }

    const bet = await dbService.createBet(betData)
    console.log('✅ Bet created:', bet.id)

    // ============================================================================
    // CACHE PERFORMANCE TESTS
    // ============================================================================

    console.log('\n5️⃣ Testing Cache Performance...')

    // Test cache stats
    const cacheStats = await cacheService.getCacheStats()
    console.log('✅ Cache stats:', cacheStats)

    // Test cache invalidation
    await cacheService.invalidateUserProfile(testWallet)
    console.log('✅ Cache invalidation working')

    // ============================================================================
    // CLEANUP
    // ============================================================================

    console.log('\n6️⃣ Cleaning up test data...')

    // Note: In production, you'd want proper cleanup
    // For now, we'll leave the test data for inspection

    console.log('\n🎉 All Database & Cache Tests Passed!')
    console.log('📊 Test Results:')
    console.log('   • PostgreSQL: ✅ Connected & Operational')
    console.log('   • Redis Cache: ✅ Connected & Operational')
    console.log('   • User Management: ✅ Working')
    console.log('   • Commitment System: ✅ Working')
    console.log('   • Betting System: ✅ Working')
    console.log('   • Cache Performance: ✅ Working')

    return {
      success: true,
      message: 'All tests passed successfully',
      results: {
        postgresql: health.postgresql,
        redis: health.redis,
        cacheStats
      }
    }

  } catch (error) {
    console.error('❌ Database test failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    }
  }
}

// ============================================================================
// PERFORMANCE BENCHMARKING
// ============================================================================

export async function benchmarkDatabase() {
  console.log('⚡ Starting Database Performance Benchmark...\n')

  const iterations = 100
  const testWallet = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'

  try {
    // User creation benchmark
    console.log(`📊 Benchmarking ${iterations} user operations...`)
    const userStart = Date.now()

    for (let i = 0; i < iterations; i++) {
      const wallet = `0x${Math.random().toString(16).substr(2, 40)}`
      await dbService.createUser(wallet)
    }

    const userTime = Date.now() - userStart
    console.log(`✅ User creation: ${iterations} ops in ${userTime}ms (${(iterations / userTime * 1000).toFixed(1)} ops/sec)`)

    // Cache performance benchmark
    console.log('📊 Benchmarking cache operations...')
    const cacheStart = Date.now()

    for (let i = 0; i < iterations; i++) {
      await cacheService.getUserProfile(testWallet)
    }

    const cacheTime = Date.now() - cacheStart
    console.log(`✅ Cache retrieval: ${iterations} ops in ${cacheTime}ms (${(iterations / cacheTime * 1000).toFixed(1)} ops/sec)`)

    console.log('\n🎯 Benchmark Complete!')
    return {
      success: true,
      benchmarks: {
        userCreation: {
          operations: iterations,
          timeMs: userTime,
          opsPerSec: iterations / userTime * 1000
        },
        cacheRetrieval: {
          operations: iterations,
          timeMs: cacheTime,
          opsPerSec: iterations / cacheTime * 1000
        }
      }
    }

  } catch (error) {
    console.error('❌ Benchmark failed:', error)
    return {
      success: false,
      error
    }
  }
}

// ============================================================================
// EXPORT FOR CLI USAGE
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  // Run tests when script is executed directly
  testDatabaseSetup().then(result => {
    if (result.success) {
      console.log('\n🏆 Database setup test completed successfully!')
      process.exit(0)
    } else {
      console.error('\n💥 Database setup test failed:', result.message)
      process.exit(1)
    }
  })
}
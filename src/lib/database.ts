import { PrismaClient } from '@prisma/client'

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
// DATABASE HEALTH CHECKS
// ============================================================================

export async function checkDatabaseHealth() {
  try {
    // Test PostgreSQL connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ PostgreSQL connection healthy')

    return { postgresql: true }
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    return { postgresql: false }
  }
}

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

export async function disconnectDatabases() {
  try {
    await prisma.$disconnect()
    console.log('✅ Databases disconnected successfully')
  } catch (error) {
    console.error('❌ Error disconnecting databases:', error)
  }
}

// Graceful shutdown
process.on('SIGTERM', disconnectDatabases)
process.on('SIGINT', disconnectDatabases)
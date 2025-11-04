import { PrismaClient } from '@prisma/client'

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

// Prisma Client (PostgreSQL)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient | null {
  // Return existing instance if available
  if (prismaInstance) {
    return prismaInstance;
  }

  // Don't initialize during build time
  const isBuildTime = (
    // Netlify build environment
    process.env.NETLIFY === 'true' ||
    // Vercel build environment (but not development)
    (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'development') ||
    // Manual skip flag
    process.env.SKIP_DB_INIT === 'true' ||
    // No database URL available
    !process.env.DATABASE_URL
  );

  if (isBuildTime) {
    console.log('⚠️ Skipping PrismaClient initialization during build time or missing DATABASE_URL');
    return null;
  }

  // Create new instance
  prismaInstance = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }

  return prismaInstance;
}

// Create a safe prisma proxy that handles build time gracefully
const createSafePrismaProxy = () => {
  const getClient = () => {
    const client = getPrismaClient();
    if (!client) {
      throw new Error('Database not available during build time');
    }
    return client;
  };

  return {
    get instance() {
      return getPrismaClient();
    },

    $queryRaw: async () => {
      const client = getPrismaClient();
      if (!client) {
        throw new Error('Database not available during build time');
      }
      return client.$queryRaw`SELECT 1`;
    },

    $disconnect: async () => {
      const client = getPrismaClient();
      if (client) {
        return client.$disconnect();
      }
    }
  };
};

export const prisma = createSafePrismaProxy();

// ============================================================================
// DATABASE HEALTH CHECKS
// ============================================================================

export async function checkDatabaseHealth() {
  try {
    const client = prisma.instance;
    if (!client) {
      console.log('⚠️ Database health check skipped during build time');
      return { postgresql: false, reason: 'Build time or missing DATABASE_URL' };
    }

    // Test PostgreSQL connection
    await client.$queryRaw`SELECT 1`
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
    const client = prisma.instance;
    if (client) {
      await client.$disconnect();
    }
    console.log('✅ Databases disconnected successfully')
  } catch (error) {
    console.error('❌ Error disconnecting databases:', error)
  }
}

// Graceful shutdown
process.on('SIGTERM', disconnectDatabases)
process.on('SIGINT', disconnectDatabases)
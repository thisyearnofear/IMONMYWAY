#!/usr/bin/env tsx

/**
 * Script to apply database migrations
 * Usage: npm run migrate:apply
 */

import { execSync } from 'child_process';

async function applyMigrations() {
  try {
    console.log('🔄 Applying database migrations');
    
    // Run Prisma migration
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit'
    });
    
    console.log('✅ Migrations applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply migrations:', error);
    process.exit(1);
  }
}

// Run the script
applyMigrations();
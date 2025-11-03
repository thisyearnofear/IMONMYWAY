#!/usr/bin/env tsx

/**
 * Script to generate database migrations
 * Usage: npm run migrate:generate -- "migration_name"
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

async function generateMigration() {
  // Get migration name from command line arguments
  const args = process.argv.slice(2);
  const migrationName = args[0];
  
  if (!migrationName) {
    console.error('❌ Please provide a migration name');
    console.log('Usage: npm run migrate:generate -- "migration_name"');
    process.exit(1);
  }
  
  try {
    console.log(`🔄 Generating migration: ${migrationName}`);
    
    // Run Prisma migration
    execSync(`npx prisma migrate dev --name ${migrationName}`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Migration generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate migration:', error);
    process.exit(1);
  }
}

// Run the script
generateMigration();
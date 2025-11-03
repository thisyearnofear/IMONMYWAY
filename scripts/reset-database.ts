#!/usr/bin/env tsx

/**
 * Script to reset the database
 * Usage: npm run db:reset
 */

import { execSync } from 'child_process';

async function resetDatabase() {
  // Confirm with user
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('⚠️  This will reset the database. Are you sure? (yes/no): ', (answer: string) => {
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Database reset cancelled');
      process.exit(0);
    }
    
    try {
      console.log('🔄 Resetting database');
      
      // Run Prisma reset
      execSync('npx prisma migrate reset --force', {
        stdio: 'inherit'
      });
      
      console.log('✅ Database reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset database:', error);
      process.exit(1);
    }
  });
}

// Run the script
resetDatabase();
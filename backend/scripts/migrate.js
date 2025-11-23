// scripts/migrate.js - Database migration utility
require('dotenv').config();
const { connectDB, closePool } = require('../config/database');
const { createTables, dropTables } = require('../config/initDatabase');

const runMigration = async () => {
  try {
    console.log('🚀 Starting database migration...');
    
    // Connect to PostgreSQL
    await connectDB();
    
    // Get command line argument
    const command = process.argv[2];
    
    switch (command) {
      case 'up':
        console.log('📈 Running migration UP (creating tables)...');
        await createTables();
        break;
        
      case 'down':
        console.log('📉 Running migration DOWN (dropping tables)...');
        await dropTables();
        break;
        
      case 'reset':
        console.log('🔄 Resetting database (drop and recreate)...');
        await dropTables();
        await createTables();
        break;
        
      default:
        console.log('Usage: node migrate.js [up|down|reset]');
        console.log('  up    - Create all tables');
        console.log('  down  - Drop all tables');
        console.log('  reset - Drop and recreate all tables');
        process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await closePool();
    process.exit(0);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
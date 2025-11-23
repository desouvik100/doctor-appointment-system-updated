// scripts/migrateUserData.js - Migrate user data from MongoDB to PostgreSQL
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, closePool } = require('../config/database');
const { createTables } = require('../config/initDatabase');
const TenantManager = require('../utils/tenantManager');
const UserPostgres = require('../models/UserPostgres');

// MongoDB User model (temporary for migration)
const mongoUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  role: String,
  clinicId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const MongoUser = mongoose.model('User', mongoUserSchema);

const migrateUserData = async () => {
  let mongoConnection = null;
  
  try {
    console.log('🚀 Starting user data migration from MongoDB to PostgreSQL...');
    
    // Connect to PostgreSQL
    console.log('📡 Connecting to PostgreSQL...');
    await connectDB();
    
    // Ensure tables exist
    console.log('🔧 Ensuring PostgreSQL tables exist...');
    await createTables();
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    mongoConnection = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get default tenant (create if doesn't exist)
    let defaultTenant = await TenantManager.getDefaultTenant();
    if (!defaultTenant) {
      console.log('🏢 Creating default tenant...');
      defaultTenant = await TenantManager.createTenant({
        name: 'Default Organization',
        subdomain: 'default',
        settings: { isDefault: true }
      });
    }
    
    console.log(`✅ Using tenant: ${defaultTenant.name} (${defaultTenant.id})`);
    
    // Fetch all users from MongoDB
    console.log('📥 Fetching users from MongoDB...');
    const mongoUsers = await MongoUser.find({}).lean();
    console.log(`Found ${mongoUsers.length} users in MongoDB`);
    
    if (mongoUsers.length === 0) {
      console.log('ℹ️  No users found in MongoDB to migrate');
      return;
    }
    
    // Check if users already exist in PostgreSQL
    const existingUsers = await UserPostgres.findAll(defaultTenant.id);
    console.log(`Found ${existingUsers.length} existing users in PostgreSQL`);
    
    if (existingUsers.length > 0) {
      const shouldContinue = process.argv.includes('--force');
      if (!shouldContinue) {
        console.log('⚠️  Users already exist in PostgreSQL. Use --force to migrate anyway');
        return;
      }
    }
    
    // Migrate each user
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const mongoUser of mongoUsers) {\n      try {\n        // Check if user already exists in PostgreSQL\n        const existingUser = await UserPostgres.findByEmail(mongoUser.email, defaultTenant.id);\n        \n        if (existingUser) {\n          console.log(`⏭️  User ${mongoUser.email} already exists, skipping...`);\n          skippedCount++;\n          continue;\n        }\n        \n        // Create user in PostgreSQL\n        // Note: We can't migrate the actual password hash due to different hashing,\n        // so we'll create a temporary password that users need to reset\n        const tempPassword = 'TempPass123!'; // Users will need to reset this\n        \n        const userData = {\n          name: mongoUser.name,\n          email: mongoUser.email,\n          password: tempPassword, // Temporary password\n          role: mongoUser.role || 'patient'\n        };\n        \n        // Note: clinicId migration would need clinic data migration first\n        // For now, we'll set it to null and handle clinic assignment separately\n        \n        const newUser = await UserPostgres.create(userData, defaultTenant.id);\n        \n        console.log(`✅ Migrated user: ${newUser.email} (${newUser.role})`);\n        migratedCount++;\n        \n      } catch (error) {\n        console.error(`❌ Failed to migrate user ${mongoUser.email}:`, error.message);\n        errorCount++;\n      }\n    }\n    \n    console.log('\\n🎉 Migration completed!');\n    console.log(`📊 Summary:`);\n    console.log(`  - Migrated: ${migratedCount} users`);\n    console.log(`  - Skipped: ${skippedCount} users`);\n    console.log(`  - Errors: ${errorCount} users`);\n    \n    if (migratedCount > 0) {\n      console.log('\\n⚠️  IMPORTANT NOTES:');\n      console.log('  - All migrated users have temporary password: \"TempPass123!\"');\n      console.log('  - Users need to reset their passwords on first login');\n      console.log('  - Clinic assignments need to be set up separately');\n      console.log('  - Consider implementing a password reset flow');\n    }\n    \n  } catch (error) {\n    console.error('❌ Migration failed:', error.message);\n    process.exit(1);\n  } finally {\n    // Close connections\n    if (mongoConnection) {\n      await mongoose.disconnect();\n      console.log('✅ Disconnected from MongoDB');\n    }\n    await closePool();\n    console.log('✅ Disconnected from PostgreSQL');\n    process.exit(0);\n  }\n};\n\n// Create admin user helper\nconst createAdminUser = async () => {\n  try {\n    console.log('👑 Creating admin user...');\n    \n    await connectDB();\n    await createTables();\n    \n    let defaultTenant = await TenantManager.getDefaultTenant();\n    if (!defaultTenant) {\n      defaultTenant = await TenantManager.createTenant({\n        name: 'Default Organization',\n        subdomain: 'default',\n        settings: { isDefault: true }\n      });\n    }\n    \n    const adminData = {\n      name: 'System Administrator',\n      email: 'admin@example.com',\n      password: 'admin123',\n      role: 'admin'\n    };\n    \n    const existingAdmin = await UserPostgres.findByEmail(adminData.email, defaultTenant.id);\n    if (existingAdmin) {\n      console.log('ℹ️  Admin user already exists');\n      return;\n    }\n    \n    const admin = await UserPostgres.create(adminData, defaultTenant.id);\n    console.log(`✅ Admin user created: ${admin.email}`);\n    console.log(`🔑 Password: ${adminData.password}`);\n    \n  } catch (error) {\n    console.error('❌ Failed to create admin user:', error.message);\n  } finally {\n    await closePool();\n    process.exit(0);\n  }\n};\n\n// Run based on command line argument\nif (require.main === module) {\n  const command = process.argv[2];\n  \n  switch (command) {\n    case 'users':\n      migrateUserData();\n      break;\n    case 'admin':\n      createAdminUser();\n      break;\n    default:\n      console.log('Usage: node migrateUserData.js [users|admin]');\n      console.log('  users - Migrate users from MongoDB to PostgreSQL');\n      console.log('  admin - Create admin user in PostgreSQL');\n      console.log('\\nOptions:');\n      console.log('  --force - Force migration even if users already exist');\n      process.exit(1);\n  }\n}\n\nmodule.exports = { migrateUserData, createAdminUser };
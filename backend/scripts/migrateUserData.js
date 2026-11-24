
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, closePool } = require('../config/database');
const { createTables } = require('../config/initDatabase');
const TenantManager = require('../utils/tenantManager');
const UserPostgres = require('../models/UserPostgres');
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
   console.log('📡 Connecting to PostgreSQL...');
    await connectDB();
    console.log('🔧 Ensuring PostgreSQL tables exist...');
    await createTables();
    console.log('📡 Connecting to MongoDB...');
    mongoConnection = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
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
    console.log('📥 Fetching users from MongoDB...');
   const mongoUsers = await MongoUser.find({}).lean();
    console.log(`Found ${mongoUsers.length} users in MongoDB`);
    
    if (mongoUsers.length === 0) {
      console.log('ℹ️  No users found in MongoDB to migrate');
      return;
    }
    const existingUsers = await UserPostgres.findAll(defaultTenant.id); 
    console.log(`Found ${existingUsers.length} existing users in PostgreSQL`);
    
    if (existingUsers.length > 0) {
      const shouldContinue = process.argv.includes('--force');
      if (!shouldContinue) {
        console.log('⚠️  Users already exist in PostgreSQL. Use --force to migrate anyway');
        return;
      }
    }
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const mongoUser of mongoUsers) {\n      try {\n        
/**
 * Create Test Account for Razorpay Verification
 * Run: node create-test-account.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Test account credentials
const TEST_ACCOUNT = {
  name: 'Razorpay Test User',
  email: 'test@healthsyncpro.in',
  password: 'Test@123456',
  phone: '9876543210',
  role: 'patient',
  isActive: true
};

async function createTestAccount() {
  try {
    // Connect to MongoDB
    console.log('Connecting to:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas (Production)');
    console.log('Database:', mongoose.connection.name);

    // DELETE all existing test accounts first
    console.log('\n🗑️  Deleting existing test accounts...');
    const deleteResult = await User.deleteMany({ 
      email: { $in: ['test@healthsyncpro.in', 'razorpay@test.com', 'test@test.com'] }
    });
    console.log(`   Deleted ${deleteResult.deletedCount} existing test account(s)`);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_ACCOUNT.password, salt);

    // Create fresh test user
    const testUser = new User({
      ...TEST_ACCOUNT,
      password: hashedPassword
    });

    await testUser.save();

    console.log('\n✅ Fresh test account created successfully!');
    console.log('   User ID:', testUser._id);
    console.log('\n========================================');
    console.log('TEST ACCOUNT CREDENTIALS FOR RAZORPAY:');
    console.log('========================================');
    console.log(`Email:    ${TEST_ACCOUNT.email}`);
    console.log(`Password: ${TEST_ACCOUNT.password}`);
    console.log('========================================\n');
    console.log('Use these credentials for Razorpay verification.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createTestAccount();

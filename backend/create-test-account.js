/**
 * Create Test Account for Razorpay Verification
 * Run: node create-test-account.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: { type: String, default: 'patient' },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Test account credentials
const TEST_ACCOUNT = {
  name: 'Razorpay Test User',
  email: 'test@healthsyncpro.in',
  password: 'Test@123456',
  phone: '9876543210',
  role: 'patient',
  isVerified: true
};

async function createTestAccount() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test account already exists
    const existingUser = await User.findOne({ email: TEST_ACCOUNT.email });
    
    if (existingUser) {
      console.log('ℹ️  Test account already exists');
      console.log('\n========================================');
      console.log('TEST ACCOUNT CREDENTIALS FOR RAZORPAY:');
      console.log('========================================');
      console.log(`Email:    ${TEST_ACCOUNT.email}`);
      console.log(`Password: ${TEST_ACCOUNT.password}`);
      console.log('========================================\n');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_ACCOUNT.password, salt);

    // Create test user
    const testUser = new User({
      ...TEST_ACCOUNT,
      password: hashedPassword
    });

    await testUser.save();

    console.log('✅ Test account created successfully!\n');
    console.log('========================================');
    console.log('TEST ACCOUNT CREDENTIALS FOR RAZORPAY:');
    console.log('========================================');
    console.log(`Email:    ${TEST_ACCOUNT.email}`);
    console.log(`Password: ${TEST_ACCOUNT.password}`);
    console.log('========================================\n');
    console.log('Use these credentials for Razorpay verification.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createTestAccount();

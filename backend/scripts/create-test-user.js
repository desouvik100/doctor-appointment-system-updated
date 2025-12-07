// Script to create a test user account for Razorpay verification
// Run this once on production to create the test account

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// Test User Credentials for Razorpay Verification
const TEST_USER = {
  name: 'Razorpay Test User',
  email: 'testuser@healthsync.com',
  password: 'Test@123456',
  phone: '+91-9999999999',
  role: 'patient',
  isVerified: true,
  address: {
    street: '123 Test Street',
    city: 'Bankura',
    state: 'West Bengal',
    pincode: '722101',
    country: 'India'
  },
  dateOfBirth: new Date('1990-01-15'),
  gender: 'male',
  bloodGroup: 'O+',
  emergencyContact: {
    name: 'Emergency Contact',
    phone: '+91-8888888888',
    relationship: 'Family'
  }
};

async function createTestUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User schema inline (to avoid import issues)
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true, lowercase: true },
      password: String,
      phone: String,
      role: { type: String, default: 'patient' },
      isVerified: { type: Boolean, default: true },
      address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String
      },
      dateOfBirth: Date,
      gender: String,
      bloodGroup: String,
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String
      },
      createdAt: { type: Date, default: Date.now }
    }, { collection: 'users' });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Check if test user already exists
    const existingUser = await User.findOne({ email: TEST_USER.email });
    
    if (existingUser) {
      console.log('⚠️ Test user already exists!');
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('   TEST USER CREDENTIALS FOR RAZORPAY VERIFICATION');
      console.log('═══════════════════════════════════════════════════════');
      console.log('   Email:    testuser@healthsync.com');
      console.log('   Password: Test@123456');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(TEST_USER.password, salt);

      // Create test user
      const testUser = new User({
        ...TEST_USER,
        password: hashedPassword
      });

      await testUser.save();

      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('   ✅ TEST USER CREATED SUCCESSFULLY!');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log('   📧 Email:    testuser@healthsync.com');
      console.log('   🔑 Password: Test@123456');
      console.log('');
      console.log('   Use these credentials for Razorpay verification.');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();

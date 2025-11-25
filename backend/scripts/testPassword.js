const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const testPassword = async () => {
  try {
    console.log('🔐 Testing admin password...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find admin user
    const adminEmail = 'admin@healthsyncpro.in';
    const testPassword = 'admin123';
    
    const admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      console.log('✅ Admin user found');
      console.log('🔐 Testing password:', testPassword);
      
      // Test password comparison
      const isMatch = await bcrypt.compare(testPassword, admin.password);
      console.log('🔍 Password match result:', isMatch);
      
      if (isMatch) {
        console.log('✅ Password is correct!');
      } else {
        console.log('❌ Password does not match!');
        
        // Let's create a new hash and compare
        console.log('🔧 Creating new hash for comparison...');
        const newHash = await bcrypt.hash(testPassword, 10);
        const newMatch = await bcrypt.compare(testPassword, newHash);
        console.log('🔍 New hash comparison:', newMatch);
      }
    } else {
      console.log('❌ Admin user not found!');
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testPassword();
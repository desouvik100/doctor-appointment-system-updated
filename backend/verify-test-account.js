/**
 * Verify Test Account exists and password works
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function verifyTestAccount() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to:', mongoose.connection.name);

    // Find the test user
    const user = await User.findOne({ email: 'test@healthsyncpro.in' });
    
    if (!user) {
      console.log('❌ Test user NOT FOUND in database!');
      return;
    }

    console.log('\n✅ Test user found:');
    console.log('   ID:', user._id);
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   isActive:', user.isActive);
    console.log('   Created:', user.createdAt);

    // Test password
    const testPassword = 'Test@123456';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    console.log('\n🔐 Password verification:');
    console.log('   Test password:', testPassword);
    console.log('   Hash in DB:', user.password.substring(0, 20) + '...');
    console.log('   Password matches:', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
      console.log('\n⚠️  Password mismatch! Re-hashing password...');
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(testPassword, salt);
      user.password = newHash;
      await user.save();
      console.log('✅ Password updated!');
      
      // Verify again
      const recheck = await bcrypt.compare(testPassword, user.password);
      console.log('   Re-verification:', recheck ? '✅ SUCCESS' : '❌ FAILED');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

verifyTestAccount();

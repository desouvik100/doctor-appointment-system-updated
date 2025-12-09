// Script to unsuspend a user
// Run with: node backend/scripts/unsuspend-user.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  console.error('   Please set it in backend/.env file');
  process.exit(1);
}

async function unsuspendUser(email) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('../models/User');
    const Doctor = require('../models/Doctor');

    // Try to find in Users collection
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let collection = 'User';

    if (!user) {
      // Try Doctors collection
      user = await Doctor.findOne({ email: email.toLowerCase().trim() });
      collection = 'Doctor';
    }

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n📋 Current user status:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Collection: ${collection}`);
    console.log(`   isActive: ${user.isActive}`);
    console.log(`   suspendReason: ${user.suspendReason || 'N/A'}`);
    console.log(`   suspendedAt: ${user.suspendedAt || 'N/A'}`);

    if (user.isActive === true) {
      console.log(`\n✅ User is already active, no action needed.`);
      process.exit(0);
    }

    // Unsuspend the user
    const updateResult = await (collection === 'Doctor' ? Doctor : User).findByIdAndUpdate(
      user._id,
      {
        $set: { isActive: true },
        $unset: { suspendedAt: 1, suspendReason: 1 }
      },
      { new: true }
    );

    console.log(`\n✅ User unsuspended successfully!`);
    console.log(`   isActive: ${updateResult.isActive}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'desouvik2018@gmail.com';
console.log(`\n🔓 Unsuspending user: ${email}\n`);
unsuspendUser(email);

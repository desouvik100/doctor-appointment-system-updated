/**
 * Utility script to check user existence and reset password
 * Usage: node scripts/reset-user-password.js <email> <new-password>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor_appointment';

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email) {
    console.log('Usage: node scripts/reset-user-password.js <email> [new-password]');
    console.log('  - If only email provided: checks if user exists');
    console.log('  - If email and password provided: resets the password');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`❌ No user found with email: ${normalizedEmail}`);
      console.log('💡 You need to register first using the Sign Up button.');
      process.exit(1);
    }

    console.log('\n📋 User found:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Approval Status: ${user.approvalStatus}`);

    if (user.role !== 'patient') {
      console.log(`\n⚠️  This user has role "${user.role}", not "patient".`);
      console.log('   Use the appropriate login page (Admin/Clinic login).');
    }

    if (!user.isActive) {
      console.log('\n⚠️  This user account is deactivated.');
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        console.log('\n❌ Password must be at least 6 characters.');
        process.exit(1);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(user._id, { 
        password: hashedPassword,
        isActive: true  // Also reactivate the account
      });
      console.log(`\n✅ Password reset successfully for ${normalizedEmail}`);
      console.log('✅ Account reactivated');
      console.log('   You can now login with the new password.');
    }

    // Option to just reactivate without changing password
    if (!newPassword && !user.isActive) {
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      
      rl.question('\n🔄 Reactivate this account? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await User.findByIdAndUpdate(user._id, { isActive: true });
          console.log('✅ Account reactivated successfully!');
        }
        rl.close();
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
      });
      return; // Don't disconnect yet, wait for user input
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

main();

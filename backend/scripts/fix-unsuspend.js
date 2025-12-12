// Script to unsuspend a specific user
// Run with: node backend/scripts/fix-unsuspend.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function unsuspendUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('../models/User');
    const Doctor = require('../models/Doctor');

    const email = 'desouvik2018@gmail.com';
    
    // Check in User collection
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      console.log(`Found in User collection: ${user.name}, isActive: ${user.isActive}`);
      const result = await User.findByIdAndUpdate(
        user._id,
        { $set: { isActive: true }, $unset: { suspendedAt: 1, suspendReason: 1 } },
        { new: true }
      );
      console.log(`✅ User updated: isActive = ${result.isActive}`);
    }

    // Check in Doctor collection
    let doctor = await Doctor.findOne({ email: email.toLowerCase() });
    if (doctor) {
      console.log(`Found in Doctor collection: ${doctor.name}, isActive: ${doctor.isActive}`);
      const result = await Doctor.findByIdAndUpdate(
        doctor._id,
        { $set: { isActive: true }, $unset: { suspendedAt: 1, suspendReason: 1 } },
        { new: true }
      );
      console.log(`✅ Doctor updated: isActive = ${result.isActive}`);
    }

    if (!user && !doctor) {
      console.log('❌ User not found in either collection');
    }

    // Show all suspended users
    console.log('\n--- All Suspended Users ---');
    const suspendedUsers = await User.find({ isActive: false }).select('name email role isActive');
    const suspendedDoctors = await Doctor.find({ isActive: false }).select('name email isActive');
    
    console.log('Suspended Users:', suspendedUsers.length);
    suspendedUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    
    console.log('Suspended Doctors:', suspendedDoctors.length);
    suspendedDoctors.forEach(d => console.log(`  - ${d.email}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

unsuspendUser();

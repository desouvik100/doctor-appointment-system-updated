// Check admin user status
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('../models/User');
    
    const email = 'admin@healthsyncpro.in';
    const admin = await User.findOne({ email: email.toLowerCase() });
    
    if (admin) {
      console.log('\n--- Admin User Found ---');
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('isActive:', admin.isActive);
      console.log('suspendedAt:', admin.suspendedAt);
      console.log('suspendReason:', admin.suspendReason);
      
      // If suspended, unsuspend
      if (admin.isActive === false) {
        console.log('\n⚠️ Admin is suspended! Unsuspending...');
        await User.findByIdAndUpdate(admin._id, {
          $set: { isActive: true },
          $unset: { suspendedAt: 1, suspendReason: 1 }
        });
        console.log('✅ Admin unsuspended!');
      }
    } else {
      console.log('❌ Admin not found with email:', email);
      
      // List all admins
      const allAdmins = await User.find({ role: 'admin' }).select('name email isActive');
      console.log('\n--- All Admin Users ---');
      allAdmins.forEach(a => console.log(`  - ${a.email} (${a.name}) - Active: ${a.isActive}`));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();


require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('../models/User');
    
   const email = 'admin@healthsyncpro.in';
    const newPassword = 'Admin@123'; 
    
    const admin = await User.findOne({ email: email.toLowerCase() });
    
    if (admin) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(admin._id, {
        password: hashedPassword
      });
      
      console.log('\n✅ Admin password reset successfully!');
      console.log('Email:', email);
      console.log('New Password:', newPassword);
    } else {
      console.log('❌ Admin not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
} 

resetAdminPassword();

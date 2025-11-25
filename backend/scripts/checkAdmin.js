const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const checkAdmin = async () => {
  try {
    console.log('🔍 Checking admin user in database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find admin user
    const adminEmail = 'admin@healthsyncpro.in';
    const admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      console.log('✅ Admin user found!');
      console.log('📧 Email:', admin.email);
      console.log('👤 Name:', admin.name);
      console.log('🔑 Role:', admin.role);
      console.log('✅ Active:', admin.isActive);
      console.log('📋 Approval Status:', admin.approvalStatus);
      console.log('🆔 ID:', admin._id);
      console.log('🔐 Password Hash:', admin.password ? 'Present' : 'Missing');
    } else {
      console.log('❌ Admin user not found!');
      
      // Check if any users exist
      const userCount = await User.countDocuments();
      console.log('👥 Total users in database:', userCount);
      
      // Check if any admin users exist
      const adminCount = await User.countDocuments({ role: 'admin' });
      console.log('👑 Total admin users:', adminCount);
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkAdmin();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

// Import User model
const User = require('./backend/models/User');

const createAdmin = async () => {
  try {
    console.log('🔧 Creating admin user...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Admin credentials
    const adminEmail = 'admin@healthsyncpro.in';
    const adminPassword = 'admin123';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      // Update existing admin
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.approvalStatus = 'approved';
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin
      const admin = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        approvalStatus: 'approved'
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully');
    }
    
    console.log('📧 Admin Email:', adminEmail);
    console.log('🔑 Admin Password:', adminPassword);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
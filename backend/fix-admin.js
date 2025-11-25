const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const fixAdmin = async () => {
  try {
    console.log('🔧 Fixing admin credentials...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Admin credentials that should work (matching the form)
    const adminEmail = 'admin@healthsyncpro.in';
    const adminPassword = 'admin123';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Update or create admin
    const result = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        approvalStatus: 'approved',
        isActive: true
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Admin credentials fixed!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Admin ID:', result._id);
    
    await mongoose.disconnect();
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixAdmin();
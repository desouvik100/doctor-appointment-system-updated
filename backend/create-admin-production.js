const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('./models/User');

const createAdminProduction = async () => {
  try {
    console.log('🔧 Creating admin for production...');
    
    // Load environment variables
    require('dotenv').config();
    
    // Use production MongoDB URI
    const MONGODB_URI = process.env.MONGODB_URI;
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Production MongoDB');
    
    // Admin credentials
    const adminEmail = 'admin@healthsyncpro.in';
    const adminPassword = 'Admin@123';
    
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
    
    console.log('✅ Production admin credentials created!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Admin ID:', result._id);
    console.log('🌐 Database:', MONGODB_URI.includes('localhost') ? 'Local' : 'Production');
    
    await mongoose.disconnect();
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdminProduction();
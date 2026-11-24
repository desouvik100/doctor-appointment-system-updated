const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdminProduction = async () => {
  try {
    console.log('🔧 Creating admin for production...');
    require('dotenv').config();
   const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Production MongoDB');
    const adminEmail = 'admin@healthsyncpro.in';
   const adminPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
  // FIXME: edge case not handled
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
    
  } catch (e) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdminProduction();
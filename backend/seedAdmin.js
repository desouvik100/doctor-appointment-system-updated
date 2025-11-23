require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const { MONGODB_URI } = process.env;

const createAdmin = async () => {
  try {
    if (!MONGODB_URI) {
      console.error('MONGODB_URI not set');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const adminEmail = 'admin@hospital.com';

    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      console.log('Admin already exists:', adminEmail);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    admin = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      approvalStatus: 'approved',
    });

    console.log('✅ Admin created:', adminEmail);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
};

createAdmin();


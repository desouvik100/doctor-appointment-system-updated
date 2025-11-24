require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_EMAIL = process.argv[2] || 'admin@hospital2.com';
const ADMIN_PASSWORD = process.argv[3] || 'admin123';

const run = async () => {
  try {
    const uri =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';
    console.log('Connecting to', uri);
    await mongoose.connect(uri);

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const result = await User.updateOne(
      { email: ADMIN_EMAIL },
      {
        $set: {
          name: 'Admin User',
          email: ADMIN_EMAIL,
          password: passwordHash,
          role: 'admin',
          isActive: true,
        },
      },
      { upsert: true }
    );

    console.log(`Upserted admin ${ADMIN_EMAIL}`, result);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to upsert admin:', err);
    process.exit(1);
  }
};

run();


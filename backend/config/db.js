// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Continuing without MongoDB for now...');
    // For now, you can comment this while testing:
    // process.exit(1);
  }
};

module.exports = connectDB;
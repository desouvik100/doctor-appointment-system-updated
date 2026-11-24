// config/db.js — Enhanced MongoDB connection with production optimizations
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/doctor_appointment';

    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables (MONGODB_URI)');
    }

    const options = {
      // Production-grade connection pool
      maxPoolSize: 500,        // Handle high concurrent load  
      minPoolSize: 100,        // Always ready connections
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      
      // Production performance optimizations
      bufferMaxEntries: 0,     // Disable mongoose buffering
      bufferCommands: false,   // Disable command buffering
      heartbeatFrequencyMS: 10000,
      maxStalenessSeconds: 30,
      
      // Connection reliability
      family: 4,               // Use IPv4
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      
      // Read preferences for scalability
      readPreference: 'secondaryPreferred', // Use secondary for reads when possible
    };

    await mongoose.connect(mongoUri, options);
    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔒 MongoDB connection closed');
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production requires MongoDB — exiting');
      process.exit(1);
    } else {
      console.log('⚠️ Development mode: continuing without MongoDB...');
    }
  }
};

const checkDBHealth = async () => {
  const state = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return {
    status: states[state] || 'unknown',
    connected: state === 1,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.checkDBHealth = checkDBHealth;

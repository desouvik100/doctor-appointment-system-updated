const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware - CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';
    
    // Log connection attempt (hide password)
    const safeUri = mongoUri.replace(/:[^:@]+@/, ':****@');
    console.log(`Attempting to connect to MongoDB: ${safeUri}`);
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds for Render
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Don't exit - allow server to start and show health check status
    // This helps with debugging on Render
    if (error.message.includes('authentication')) {
      console.error('💡 Authentication failed - check username/password in MONGODB_URI');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('💡 IP not whitelisted - check MongoDB Atlas Network Access settings');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Connection timeout - check network access and connection string');
    }
    
    // Retry connection every 10 seconds
    console.log('Retrying connection in 10 seconds...');
    setTimeout(connectDB, 10000);
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/clinics', require('./routes/clinicRoutes'));
app.use('/api/receptionists', require('./routes/receptionistRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Debug: Log all registered routes
console.log('\n=== REGISTERED ROUTES ===');
console.log('Auth Routes:');
console.log('  POST /api/auth/register');
console.log('  POST /api/auth/login');
console.log('  POST /api/auth/admin/login');
console.log('  POST /api/auth/receptionist/register');
console.log('  GET  /api/auth/receptionist/test');
console.log('========================\n');

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Doctor Appointment System API - MongoDB Version' });
});

// Temporary: Create admin endpoint (REMOVE AFTER CREATING ADMIN)
// GET or POST /api/create-admin
// Visit: https://your-backend.onrender.com/api/create-admin
app.get('/api/create-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    const adminEmail = 'admin@hospital.com';
    const adminPassword = 'Admin@123';

    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      return res.json({ success: true, message: 'Admin already exists', email: adminEmail });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    admin = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      approvalStatus: 'approved',
      isActive: true
    });

    res.json({ 
      success: true, 
      message: 'Admin created successfully',
      email: adminEmail,
      password: adminPassword
    });
  } catch (err) {
    if (err.code === 11000) {
      res.json({ success: false, message: 'Admin already exists' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  res.json({ 
    status: 'OK', 
    database: dbStates[dbState] || 'Unknown',
    databaseState: dbState,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origins: ${allowedOrigins.join(', ')}`);
  
  if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: MONGODB_URI not set in production!');
  }
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
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
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
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

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});
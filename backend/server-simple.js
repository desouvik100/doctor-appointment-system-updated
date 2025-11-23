const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Doctor Appointment System API - Simple Version' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Add routes one by one to identify issues
try {
  console.log('Loading auth routes...');
  app.use('/api/auth', require('./routes/authRoutes'));
  console.log('✓ Auth routes loaded');
} catch (error) {
  console.error('✗ Error loading auth routes:', error.message);
}

try {
  console.log('Loading user routes...');
  app.use('/api/users', require('./routes/userRoutes'));
  console.log('✓ User routes loaded');
} catch (error) {
  console.error('✗ Error loading user routes:', error.message);
}

try {
  console.log('Loading doctor routes...');
  app.use('/api/doctors', require('./routes/doctorRoutes'));
  console.log('✓ Doctor routes loaded');
} catch (error) {
  console.error('✗ Error loading doctor routes:', error.message);
}

try {
  console.log('Loading appointment routes...');
  app.use('/api/appointments', require('./routes/appointmentRoutes'));
  console.log('✓ Appointment routes loaded');
} catch (error) {
  console.error('✗ Error loading appointment routes:', error.message);
}

try {
  console.log('Loading clinic routes...');
  app.use('/api/clinics', require('./routes/clinicRoutes'));
  console.log('✓ Clinic routes loaded');
} catch (error) {
  console.error('✗ Error loading clinic routes:', error.message);
}

try {
  console.log('Loading receptionist routes...');
  app.use('/api/receptionists', require('./routes/receptionistRoutes'));
  console.log('✓ Receptionist routes loaded');
} catch (error) {
  console.error('✗ Error loading receptionist routes:', error.message);
}

try {
  console.log('Loading payment routes...');
  app.use('/api/payments', require('./routes/paymentRoutes'));
  console.log('✓ Payment routes loaded');
} catch (error) {
  console.error('✗ Error loading payment routes:', error.message);
}

const PORT = process.env.PORT || 5002;

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ message: 'Internal server error', error: error.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏠 Home: http://localhost:${PORT}/`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
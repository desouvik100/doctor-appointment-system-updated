const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log('Starting server...');

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
  res.json({ message: 'Doctor Appointment System API - Debug Version' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

console.log('Loading routes...');

try {
  // Load routes one by one
  console.log('Loading auth routes...');
  app.use('/api/auth', require('./routes/authRoutes'));
  
  console.log('Loading doctor routes...');
  app.use('/api/doctors', require('./routes/doctorRoutes'));
  
  console.log('Loading appointment routes...');
  app.use('/api/appointments', require('./routes/appointmentRoutes'));
  
  console.log('Loading clinic routes...');
  app.use('/api/clinics', require('./routes/clinicRoutes'));
  
  console.log('Loading receptionist routes...');
  app.use('/api/receptionists', require('./routes/receptionistRoutes'));
  
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error);
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});
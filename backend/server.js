const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { initializeScheduler } = require('./services/appointmentScheduler');
const { initializeMedicineReminders } = require('./services/medicineReminderService');

const app = express();

// Middleware
app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    return next();
  }
  // Increase limit for profile photo uploads (base64 images can be large)
  return express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/token', require('./routes/tokenRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/google', require('./routes/googleRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/location', require('./routes/locationRoutes'));
app.use('/api/family', require('./routes/familyRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/favorites', require('./routes/favoritesRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/lab-reports', require('./routes/labReportRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/ambulance', require('./routes/ambulanceRoutes'));
app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/health-checkup', require('./routes/healthCheckupRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/loyalty', require('./routes/loyaltyRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/medicine-reminders', require('./routes/medicineReminderRoutes'));
app.use('/api/health-packages', require('./routes/healthPackageRoutes'));
app.use('/api/referrals', require('./routes/referralRoutes'));
app.use('/api/loyalty-points', require('./routes/loyaltyPointsRoutes'));
app.use('/api/queue', require('./routes/queueRoutes'));
app.use('/api/doctor-leaves', require('./routes/doctorLeaveRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));

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

const PORT = process.env.PORT || 5005;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  
  // Initialize appointment scheduler after server starts
  await initializeScheduler();
  
  // Initialize medicine reminder service
  initializeMedicineReminders();
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// ========== MIDDLEWARE ==========
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// ========== MONGODB CONNECTION ==========
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        'mongodb://127.0.0.1:27017/doctor_appointment',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ========== ROUTES ==========
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth', require('./routes/otpRoutes')); // OTP routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/clinics', require('./routes/clinicRoutes'));
app.use('/api/receptionists', require('./routes/receptionistRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Debug: log some registered routes
console.log('\n=== REGISTERED ROUTES ===');
console.log('Auth Routes:');
console.log('  POST /api/auth/register');
console.log('  POST /api/auth/login');
console.log('  POST /api/auth/admin/login');
console.log('  POST /api/auth/clinic/login');
console.log('  POST /api/auth/receptionist/register');
console.log('  GET  /api/auth/receptionist/test');
console.log('Payment Routes:');
console.log('  GET  /api/payments/calculate/:appointmentId');
console.log('  POST /api/payments/initiate');
console.log('  POST /api/payments/process');
console.log('  GET  /api/payments/history/:userId');
console.log('  POST /api/payments/refund');
console.log('========================\n');

// ========== BASIC ROUTES ==========
app.get('/', (req, res) => {
  res.json({ message: 'Doctor Appointment System API - MongoDB Version' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database:
      mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ========== EMAIL TEST ROUTE (for debugging) ==========
app.get('/api/test-email', async (req, res) => {
  try {
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log(
      'EMAIL_PASS length:',
      process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'MISSING'
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log('✅ Nodemailer is ready to send emails');

    const to = req.query.to || process.env.EMAIL_USER;

    await transporter.sendMail({
      from: `"Doctor Appointment System" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Test email from Doctor Appointment System',
      text: 'If you see this, your email setup is working ✅',
    });

    return res.json({ ok: true, message: `Test email sent to ${to}` });
  } catch (err) {
    console.error('❌ Email error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(
    `Email test available at http://localhost:${PORT}/api/test-email?to=your@email.com`
  );
});
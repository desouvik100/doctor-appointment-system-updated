const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { initializeScheduler } = require('./services/appointmentScheduler');
const { initializeMedicineReminders } = require('./services/medicineReminderService');
const cacheService = require('./services/cacheService');
const { securityMonitor, trackFailedLogin } = require('./middleware/securityMiddleware');

const app = express();

// ===== PERFORMANCE OPTIMIZATIONS =====

// Initialize Redis cache (falls back to in-memory if Redis not available)
cacheService.initializeRedis().then(connected => {
  if (connected) {
    console.log('🚀 Redis cache enabled for high performance');
  }
});

// Add cache helper to all requests
app.use((req, res, next) => {
  req.cache = {
    get: cacheService.get,
    set: cacheService.set,
    del: cacheService.del
  };
  next();
});

// Simple rate limiting (in-memory)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute per IP

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const record = rateLimitMap.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      record.count++;
      if (record.count > RATE_LIMIT_MAX) {
        return res.status(429).json({ 
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
      }
    }
  }
  next();
});

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(ip);
  }
}, 60000);

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

// Response compression for better performance
app.use((req, res, next) => {
  // Add performance headers
  res.set('X-Response-Time', Date.now().toString());
  next();
});

// MongoDB connection with optimized settings for high load
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool settings for high concurrency
      maxPoolSize: 50, // Maximum connections in pool
      minPoolSize: 10, // Minimum connections to maintain
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      // Performance settings
      retryWrites: true,
      w: 'majority',
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection Pool: min=${10}, max=${50}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

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
app.use('/api/follow-ups', require('./routes/followUpRoutes'));
app.use('/api/consultation-notes', require('./routes/consultationNoteRoutes'));
app.use('/api/family', require('./routes/familyRoutes'));
app.use('/api/refills', require('./routes/refillRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/admin/email', require('./routes/adminEmailRoutes'));
app.use('/api/security', require('./routes/securityRoutes'));

// Apply security monitoring to all API routes
app.use('/api', securityMonitor);
app.use('/api/auth', trackFailedLogin);

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

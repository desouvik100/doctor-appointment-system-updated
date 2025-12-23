const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { initializeScheduler } = require('./services/appointmentScheduler');
const { initializeMedicineReminders } = require('./services/medicineReminderService');
const { initializeScheduledEmails } = require('./services/adminEmailService');
const cacheService = require('./services/cacheService');
const { securityMonitor, trackFailedLogin } = require('./middleware/securityMiddleware');
const { sanitizeInputs } = require('./middleware/validateRequest');

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
const RATE_LIMIT_MAX = 300; // 300 requests per minute per IP (increased for development)

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
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    'https://healthsyncpro.in',
    'https://www.healthsyncpro.in',
    // Capacitor mobile app origins
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
    // Android WebView
    'file://'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Security headers for production
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    return next();
  }
  // Increase limit for profile photo uploads (base64 images can be large)
  return express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global input sanitization for XSS prevention
app.use(sanitizeInputs);

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

// ===== SECURITY MONITORING =====
// Apply security middleware BEFORE routes to monitor all API activity
const { checkBlockedIP } = require('./middleware/securityMiddleware');

// Check blocked IPs on all requests
app.use('/api', checkBlockedIP);

// Check for suspended users and force logout on authenticated requests
app.use('/api', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, let the route handle it
    }

    const jwt = require('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const userId = decoded.userId || decoded.doctorId || decoded.id;
      const tokenIssuedAt = decoded.iat ? new Date(decoded.iat * 1000) : null;
      
      if (userId) {
        const User = require('./models/User');
        const Doctor = require('./models/Doctor');
        
        let userRecord = null;
        
        if (decoded.doctorId) {
          userRecord = await Doctor.findById(decoded.doctorId).select('isActive suspendReason forceLogoutAt').lean();
        } else {
          userRecord = await User.findById(userId).select('isActive suspendReason forceLogoutAt').lean();
        }
        
        if (userRecord) {
          // Check if user is suspended
          if (userRecord.isActive === false) {
            console.log(`🚫 Blocked suspended user: ${userId}`);
            return res.status(403).json({
              success: false,
              message: 'Your account has been suspended',
              reason: userRecord.suspendReason || 'Contact admin for more information',
              suspended: true
            });
          }
          
          // Check if force logout was triggered after token was issued
          if (userRecord.forceLogoutAt && tokenIssuedAt) {
            const forceLogoutTime = new Date(userRecord.forceLogoutAt);
            if (forceLogoutTime > tokenIssuedAt) {
              console.log(`🔒 Force logout: Token issued at ${tokenIssuedAt.toISOString()}, force logout at ${forceLogoutTime.toISOString()}`);
              return res.status(401).json({
                success: false,
                message: 'Your session has been terminated. Please log in again.',
                forceLogout: true
              });
            }
          }
        }
      }
    } catch (jwtError) {
      // Invalid token, let the route handle it
    }
    
    next();
  } catch (error) {
    console.error('Security check middleware error:', error);
    next(); // Don't block on errors
  }
});

// Apply security monitoring to track activities (runs after response)
app.use('/api', securityMonitor);

// Track failed login attempts specifically
app.use('/api/auth', trackFailedLogin);

console.log('🛡️ AI Security monitoring enabled');

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
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/security', require('./routes/securityRoutes'));
app.use('/api/ai', require('./routes/aiRoutes')); // AI-powered features
app.use('/api/ai-health', require('./routes/aiHealthRoutes')); // Advanced AI health features
app.use('/api/ai-report', require('./routes/aiReportRoutes')); // AI medical report analyzer
app.use('/api/slots', require('./routes/slotRoutes')); // Separate Online & Clinic slot management
app.use('/api/commission', require('./routes/commissionRoutes')); // Commission, GST & Payout system
app.use('/api/support', require('./routes/supportRoutes')); // Doctor-Admin Support Tickets
app.use('/api/doctor-control', require('./routes/doctorControlRoutes')); // Doctor Override & Emergency Controls
app.use('/api/systematic-history', require('./routes/systematicHistoryRoutes')); // Systematic History for clinical-grade consultations
app.use('/api/emr', require('./routes/emrRoutes')); // EMR Subscription Module for Clinics
app.use('/api/imaging', require('./routes/imagingRoutes')); // DICOM Imaging & Telemedicine

// ===== NEW DIFFERENTIATOR FEATURES =====
app.use('/api/family-wallet', require('./routes/familyWalletRoutes')); // Family Health Wallet
app.use('/api/health-reminders', require('./routes/healthReminderRoutes')); // Smart Health Reminders
app.use('/api/emergency-sos', require('./routes/emergencySOSRoutes')); // Emergency SOS System
app.use('/api/offline-queue', require('./routes/offlineQueueRoutes')); // Offline Queue Token System
app.use('/api/doctor-referral', require('./routes/doctorReferralRoutes')); // Doctor Referral & Zero-Commission
app.use('/api/audit', require('./routes/auditRoutes')); // Audit Log System
app.use('/api/balance-sheet', require('./routes/balanceSheetRoutes')); // Balance Sheet
app.use('/api/coupons', require('./routes/couponRoutes')); // Discount Coupons
app.use('/api/medical-files', require('./routes/medicalFileRoutes')); // Medical File Upload (Cloudinary)
app.use('/api/upload', require('./routes/uploadRoutes')); // All file uploads (profiles, docs, chat, etc.)

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
    databaseName: mongoose.connection.name,
    timestamp: new Date().toISOString()
  });
});

// Debug: Check test user (temporary - remove after verification)
app.get('/api/debug/test-user', async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findOne({ email: 'test@healthsyncpro.in' });
    if (!user) {
      return res.json({ found: false, message: 'Test user not found in database' });
    }
    res.json({
      found: true,
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      databaseName: mongoose.connection.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize appointment scheduler after server starts
  await initializeScheduler();
  
  // Initialize medicine reminder service
  initializeMedicineReminders();
  
  // Initialize admin email scheduled reports
  initializeScheduledEmails();
});

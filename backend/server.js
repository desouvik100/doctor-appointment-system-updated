const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression'); 
const helmet = require('helmet'); 
const rateLimit = require('express-rate-limit'); 
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./config/swagger');
require('dotenv').config();
const { initializeScheduler } = require('./services/appointmentScheduler');
const { initializeMedicineReminders } = require('./services/medicineReminderService');
const { initializeScheduledEmails } = require('./services/adminEmailService');
const cacheService = require('./services/cacheService');
const { initializeAllJobs } = require('./jobs');
const { securityMonitor, trackFailedLogin } = require('./middleware/securityMiddleware');
const { sanitizeInputs } = require('./middleware/validateRequest');
const { errorMiddleware, requestLoggerMiddleware } = require('./services/errorLoggingService');
const backupService = require('./services/backupService');
const { initializeSocket } = require('./services/socketManager');
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}
if (process.env.JWT_SECRET === 'fallback_secret') {
  console.error('❌ FATAL: JWT_SECRET is set to the insecure default value. Please set a strong secret.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
}));
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
if (process.env.NODE_ENV === 'production') {
  const productionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.path === '/api/health' || req.path.startsWith('/api/admin');
    }
  });
  
  app.use(productionLimiter);
  console.log('🛡️ Production rate limiting enabled');
}
cacheService.initializeRedis().then(connected => {
  if (connected) {
    console.log('🚀 Redis cache enabled for high performance');
  }
});
app.use((req, res, next) => {
  req.cache = {
    get: cacheService.get,
    set: cacheService.set,
    del: cacheService.del
  };
  next();
});
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; 
const RATE_LIMIT_MAX = 300;

app.use((req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const isLocalhost = ['127.0.0.1', 'localhost', '::1'].includes(req.ip);
  
  if (isDev || isLocalhost || process.env.PERFORMANCE_TEST === 'true') {
    console.log(`[RATE-LIMIT-BYPASS] ${req.method} ${req.path} from ${req.ip} (isDev=${isDev}, localhost=${isLocalhost})`);
    return next(); 
  }
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
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(ip);
  }
}, 60000);
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'https://healthsyncpro.in',
  'https://www.healthsyncpro.in',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
  'file://'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
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
  return express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(sanitizeInputs);
app.use((req, res, next) => {
  res.set('X-Response-Time', Date.now().toString());
  next();
});
app.use(requestLoggerMiddleware());
const connectDB = async (retryCount = 0) => {
  const MAX_RETRIES = 5;
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection Pool: min=${10}, max=${50}`);
  } catch (error) {
    if (error.code === 8000 || error.codeName === 'AtlasError' || error.message?.includes('bad auth')) {
      console.error('❌ FATAL: MongoDB authentication failed. Check MONGODB_URI credentials in Render dashboard.');
      console.error('   Error:', error.message);
      return;
    }
    if (retryCount >= MAX_RETRIES) {
      console.error(`❌ MongoDB failed after ${MAX_RETRIES} retries. Giving up.`);
      return;
    }
    const delay = Math.min(5000 * (retryCount + 1), 30000);
    console.error(`MongoDB connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);
    console.log(`Retrying in ${delay / 1000}s...`);
    setTimeout(() => connectDB(retryCount + 1), delay);
  }
};
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});
connectDB();
const { checkBlockedIP } = require('./middleware/securityMiddleware');
app.use('/api', checkBlockedIP);
app.use('/api', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); 
    }

    const jwt = require('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
          if (userRecord.isActive === false) {
            console.log(`🚫 Blocked suspended user: ${userId}`);
            return res.status(403).json({
              success: false,
              message: 'Your account has been suspended',
              reason: userRecord.suspendReason || 'Contact admin for more information',
              suspended: true
            });
          }
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
    }
    
    next();
  } catch (error) {
    console.error('Security check middleware error:', error);
    next(); 
  }
});
app.use('/api', securityMonitor);
app.use('/api/auth', trackFailedLogin);

console.log('🛡️ AI Security monitoring enabled');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'HealthSync API Documentation'
}));
app.get('/api/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

console.log('📚 Swagger docs available at /api/docs');
console.log('📄 OpenAPI JSON spec at /api/openapi.json');
app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  let cacheStatus = 'unknown';
  try {
    await cacheService.set('health_check', '1', 5);
    const val = await cacheService.get('health_check');
    cacheStatus = val === '1' ? 'healthy' : 'degraded';
  } catch { cacheStatus = 'unavailable'; }

  const healthy = dbState === 1;
  res.status(healthy ? 200 : 503).json({ 
    status: healthy ? 'OK' : 'DEGRADED',
    version: '2.2.0',
    database: {
      status: dbStates[dbState] || 'unknown',
      name: mongoose.connection.name,
      host: mongoose.connection.host
    },
    cache: cacheStatus,
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth/token', require('./routes/authTokenRoutes')); 
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
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));
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
app.use('/api/refills', require('./routes/refillRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/admin/email', require('./routes/adminEmailRoutes'));
app.use('/api/admin', require('./routes/adminBillingRoutes')); 
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/security', require('./routes/securityRoutes'));
app.use('/api/ai', require('./routes/aiRoutes')); 
app.use('/api/ai-health', require('./routes/aiHealthRoutes')); 
app.use('/api/ai-report', require('./routes/aiReportRoutes')); 
app.use('/api/ai/symptom-check', require('./routes/symptomRoutes')); 
app.use('/api/slots', require('./routes/slotRoutes')); 
app.use('/api/commission', require('./routes/commissionRoutes')); 
app.use('/api/refunds', require('./routes/refundRoutes')); 
app.use('/api/support', require('./routes/supportRoutes')); 
app.use('/api/doctor-control', require('./routes/doctorControlRoutes')); 
app.use('/api/systematic-history', require('./routes/systematicHistoryRoutes')); 
app.use('/api/emr', require('./routes/emrRoutes')); 
app.use('/api/emr-advanced', require('./routes/emrAdvancedRoutes')); 
app.use('/api/imaging', require('./routes/imagingRoutes')); 
app.use('/api/family-wallet', require('./routes/familyWalletRoutes')); 
app.use('/api/health-reminders', require('./routes/healthReminderRoutes')); 
app.use('/api/emergency-sos', require('./routes/emergencySOSRoutes')); 
app.use('/api/offline-queue', require('./routes/offlineQueueRoutes')); 
app.use('/api/doctor-referral', require('./routes/doctorReferralRoutes')); 
app.use('/api/audit', require('./routes/auditRoutes')); 
app.use('/api/balance-sheet', require('./routes/balanceSheetRoutes')); 
app.use('/api/coupons', require('./routes/couponRoutes')); 
app.use('/api/medical-files', require('./routes/medicalFileRoutes')); 
app.use('/api/upload', require('./routes/uploadRoutes')); 
app.use('/api/drugs', require('./routes/drugInteractionRoutes')); 
app.use('/api/pdf', require('./routes/pdfRoutes')); 
app.use('/api/smart-alerts', require('./routes/smartAlertRoutes')); 
app.use('/api/e-prescribe', require('./routes/ePrescribingRoutes')); 
app.use('/api/schedule', require('./routes/scheduleRoutes')); 
app.use('/api/pharmacy', require('./routes/pharmacyRoutes')); 
app.use('/api/clinic-billing', require('./routes/billingRoutes')); 
app.use('/api/staff-schedule', require('./routes/staffScheduleRoutes')); 
app.use('/api/clinic-analytics', require('./routes/clinicAnalyticsRoutes')); 
app.use('/api/advanced-queue', require('./routes/advancedQueueRoutes')); 
app.use('/api/audit-logs', require('./routes/auditLogRoutes')); 
app.use('/api/ipd', require('./routes/ipdRoutes')); 
app.use('/api/beds', require('./routes/bedRoutes')); 
app.use('/api/insurance', require('./routes/insuranceRoutes')); 
app.use('/api/branches', require('./routes/multiBranchRoutes')); 
app.use('/api/branch-staff', require('./routes/branchStaffRoutes')); 
app.use('/api/inventory', require('./routes/vendorRoutes')); 
app.use('/api/compliance', require('./routes/complianceRoutes')); 
app.use('/api/staff-management', require('./routes/staffManagementRoutes')); 
app.use('/api/feedback', require('./routes/feedbackRoutes')); 
app.use('/api/secure-files', require('./routes/secureFilesRoutes')); 
app.use('/api/security-admin', require('./routes/securityAdminRoutes')); 
app.use('/api/jobs', require('./routes/jobsRoutes')); 
console.log('\n=== REGISTERED ROUTES ===');
console.log('Auth Routes:');
console.log('  POST /api/auth/register');
console.log('  POST /api/auth/login');
console.log('  POST /api/auth/admin/login');
console.log('  POST /api/auth/receptionist/register');
console.log('  GET  /api/auth/receptionist/test');
console.log('========================\n');
app.get('/', (req, res) => {
  res.json({ 
    name: 'HealthSync API',
    version: '2.2.0',
    status: 'running',
    docs: '/api/docs',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});
app.get('/api/version', (req, res) => {
  res.json({
    version: '2.2.0',
    name: 'HealthSync Backend',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - HealthSync</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
        h1 { color: #00B894; }
        h2 { color: #2d3436; margin-top: 30px; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> January 2026</p>
      
      <h2>1. Information We Collect</h2>
      <p>HealthSync collects information you provide directly, including:</p>
      <ul>
        <li>Name, email address, and phone number</li>
        <li>Health-related data for appointment booking</li>
        <li>Profile information from social login (Google, Facebook)</li>
      </ul>
      
      <h2>2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide healthcare appointment booking services</li>
        <li>Send appointment reminders and notifications</li>
        <li>Improve our services and user experience</li>
      </ul>
      
      <h2>3. Data Security</h2>
      <p>We implement industry-standard security measures to protect your personal information, including encryption and secure data storage.</p>
      
      <h2>4. Data Sharing</h2>
      <p>We do not sell your personal information. We may share data with healthcare providers you book appointments with.</p>
      
      <h2>5. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal data. Contact us to exercise these rights.</p>
      
      <h2>6. Contact Us</h2>
      <p>For questions about this policy, contact us at: <a href="mailto:support@healthsyncpro.in">support@healthsyncpro.in</a></p>
    </body>
    </html>
  `);
});
app.get('/terms', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terms of Service - HealthSync</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
        h1 { color: #00B894; }
        h2 { color: #2d3436; margin-top: 30px; }
      </style>
    </head>
    <body>
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> January 2026</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By using HealthSync, you agree to these Terms of Service.</p>
      
      <h2>2. Description of Service</h2>
      <p>HealthSync provides a platform for booking healthcare appointments with doctors and clinics.</p>
      
      <h2>3. User Responsibilities</h2>
      <p>You agree to provide accurate information and use the service responsibly.</p>
      
      <h2>4. Medical Disclaimer</h2>
      <p>HealthSync is a booking platform and does not provide medical advice. Always consult qualified healthcare professionals.</p>
      
      <h2>5. Limitation of Liability</h2>
      <p>HealthSync is not liable for any medical outcomes or decisions made based on appointments booked through our platform.</p>
      
      <h2>6. Contact</h2>
      <p>Questions? Contact us at: <a href="mailto:support@healthsyncpro.in">support@healthsyncpro.in</a></p>
    </body>
    </html>
  `);
});
app.get('/api/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Privacy Policy - HealthSync</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
      <h1>Privacy Policy</h1>
      <p>Last updated: January 2026</p>
      <h2>Information We Collect</h2>
      <p>HealthSync collects information you provide directly, including name, email, and health-related data for appointment booking.</p>
      <h2>How We Use Your Information</h2>
      <p>We use your information to provide healthcare appointment services, send reminders, and improve our services.</p>
      <h2>Data Security</h2>
      <p>We implement industry-standard security measures to protect your personal information.</p>
      <h2>Contact Us</h2>
      <p>For questions about this policy, contact us at support@healthsyncpro.in</p>
    </body>
    </html>
  `);
});
app.get('/api/delete-data', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Data Deletion - HealthSync</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
      <h1>Data Deletion Instructions</h1>
      <p>To request deletion of your data from HealthSync:</p>
      <ol>
        <li>Log into your HealthSync account</li>
        <li>Go to Settings > Privacy</li>
        <li>Click "Delete My Account"</li>
        <li>Confirm the deletion request</li>
      </ol>
      <p>Alternatively, email us at support@healthsyncpro.in with subject "Data Deletion Request"</p>
      <p>We will process your request within 30 days.</p>
    </body>
    </html>
  `);
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});
app.use(errorMiddleware());
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
const io = initializeSocket(server);
app.locals.io = io;

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO ready for real-time connections`);
  await initializeScheduler();
  initializeMedicineReminders();
  initializeScheduledEmails();
  backupService.startScheduledBackups();
  console.log('💾 Database backup scheduler initialized');
  initializeAllJobs();
});

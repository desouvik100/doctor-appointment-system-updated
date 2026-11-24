

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL, "https://api.razorpay.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, 
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://healthsyncpro.in',
      'https://www.healthsyncpro.in',
      'http://localhost:3000',
      'http://localhost:3001',
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost',
      'https://localhost'
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};

const createAdvancedRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, 
    max = 100,
    message = 'Too many requests from this IP',
    standardHeaders = true,
    legacyHeaders = false,
    keyGenerator = (req) => req.ip,
    skip = () => false,
    onLimitReached = null
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'RATE_LIMITED',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders,
    legacyHeaders,
    keyGenerator,
    skip,
    handler: (req, res) => {
      if (onLimitReached) {
        onLimitReached(req, res);
      }
      
      console.warn(`🚨 Rate limit exceeded: IP=${req.ip}, Path=${req.path}, User=${req.userId || 'anonymous'}`);
      
      res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, 
  delayAfter: 50, 
  delayMs: 500, 
  maxDelayMs: 20000, 
  skipFailedRequests: true,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => req.ip
});

const sanitizeInput = [

  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`🚨 NoSQL injection attempt blocked: IP=${req.ip}, Key=${key}`);
    }
  }),

  xss(),

  hpp({
    whitelist: ['tags', 'categories', 'specializations'] 
  })
];

const requestLogger = (req, res, next) => {
  const start = Date.now();

  console.log(`📥 ${req.method} ${req.path} - IP: ${req.ip} - User: ${req.userId || 'anonymous'}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    
    console.log(`📤 ${statusEmoji} ${status} ${req.method} ${req.path} - ${duration}ms`);

    if (duration > 5000) {
      console.warn(`🐌 Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
    }

    if (status >= 400) {
      console.error(`🚨 Error response: ${status} ${req.method} ${req.path} - IP: ${req.ip}`);
    }
  });
  
  next();
};

const securityLogger = {
  logSuspiciousActivity: (req, activity, details = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.userId || null,
      activity,
      path: req.path,
      method: req.method,
      details
    };
    
    console.warn('🚨 SECURITY EVENT:', JSON.stringify(logEntry, null, 2));

  },
  
  logFailedAuth: (req, email, reason) => {
    securityLogger.logSuspiciousActivity(req, 'FAILED_AUTH', { email, reason });
  },
  
  logUnauthorizedAccess: (req, resource) => {
    securityLogger.logSuspiciousActivity(req, 'UNAUTHORIZED_ACCESS', { resource });
  },
  
  logDataAccess: (req, dataType, recordId) => {
    console.log(`📋 Data access: ${dataType}:${recordId} by user ${req.userId || 'anonymous'} from IP ${req.ip}`);
  }
};

const fileUploadSecurity = {

  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/dicom', 
    'text/plain'
  ],

  maxFileSize: 10 * 1024 * 1024,
  
  validateFile: (file) => {
    const errors = [];
    
    if (!fileUploadSecurity.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }
    
    if (file.size > fileUploadSecurity.maxFileSize) {
      errors.push(`File size ${file.size} exceeds maximum ${fileUploadSecurity.maxFileSize}`);
    }

    if (/[<>:"/\\|?*]/.test(file.originalname)) {
      errors.push('Invalid characters in filename');
    }
    
    return errors;
  }
};

const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API_KEY_REQUIRED',
      message: 'API key is required'
    });
  }

  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    securityLogger.logSuspiciousActivity(req, 'INVALID_API_KEY', { apiKey });
    return res.status(401).json({
      success: false,
      error: 'INVALID_API_KEY',
      message: 'Invalid API key'
    });
  }
  
  next();
};

const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      securityLogger.logSuspiciousActivity(req, 'IP_NOT_WHITELISTED', { clientIP });
      return res.status(403).json({
        success: false,
        error: 'IP_NOT_ALLOWED',
        message: 'Access denied from this IP address'
      });
    }
    
    next();
  };
};

const honeypot = (req, res, next) => {

  if (req.body && req.body.website) {
    securityLogger.logSuspiciousActivity(req, 'HONEYPOT_TRIGGERED', { 
      honeypotValue: req.body.website 
    });

    return res.status(200).json({ success: true });
  }
  
  next();
};

const securityStack = [

  compression(),

  securityHeaders,

  cors(corsOptions),

  requestLogger,

  speedLimiter,

  ...sanitizeInput,

  honeypot
];

module.exports = {
  securityStack,
  securityHeaders,
  corsOptions,
  createAdvancedRateLimit,
  speedLimiter,
  sanitizeInput,
  requestLogger,
  securityLogger,
  fileUploadSecurity,
  validateApiKey,
  ipWhitelist,
  honeypot
};
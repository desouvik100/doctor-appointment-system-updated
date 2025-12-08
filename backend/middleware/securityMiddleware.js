const aiSecurityService = require('../services/aiSecurityService');

// Extract user info from request
const extractUserInfo = (req) => {
  // Try to get user from various auth sources
  const user = req.user || req.admin || req.doctor || req.receptionist;
  
  if (!user) return null;
  
  return {
    userId: user._id || user.id,
    userType: user.role === 'admin' ? 'Admin' : 
              user.specialization ? 'Doctor' : 
              user.clinicId && !user.specialization ? 'Receptionist' : 'User',
    userName: user.name,
    userEmail: user.email,
    userRole: user.role
  };
};

// Determine action type from request
const getActionType = (req) => {
  const method = req.method;
  const path = req.path.toLowerCase();
  
  if (path.includes('login') || path.includes('auth')) return 'login';
  if (path.includes('export') || path.includes('pdf')) return 'export';
  if (path.includes('payment') || path.includes('wallet')) return 'payment';
  if (method === 'DELETE') return 'delete';
  if (method === 'PUT' || method === 'PATCH') return 'modification';
  if (method === 'POST' && (path.includes('user') || path.includes('doctor'))) return 'create_user';
  if (method === 'GET' && req.query.limit > 50) return 'bulk_access';
  
  return 'data_access';
};

// Check if IP is blocked middleware
const checkBlockedIP = async (req, res, next) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
  
  const block = aiSecurityService.isIPBlocked(ipAddress);
  if (block) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Your IP has been blocked.',
      reason: block.reason,
      blockedUntil: new Date(block.expiresAt).toISOString()
    });
  }
  
  next();
};

// Check if user is suspended middleware
const checkSuspendedUser = async (req, res, next) => {
  const user = req.user || req.admin || req.doctor || req.receptionist;
  
  if (user) {
    const suspension = aiSecurityService.isUserSuspended(user._id || user.id);
    if (suspension) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended.',
        reason: suspension.reason,
        suspendedUntil: new Date(suspension.expiresAt).toISOString()
      });
    }
  }
  
  next();
};

// Main security monitoring middleware
const securityMonitor = async (req, res, next) => {
  // Skip monitoring for certain paths
  const skipPaths = ['/api/security', '/health', '/api/otp'];
  if (skipPaths.some(p => req.path.startsWith(p))) {
    return next();
  }

  // Check if IP is blocked
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
  const block = aiSecurityService.isIPBlocked(ipAddress);
  if (block) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Your IP has been blocked.',
      reason: block.reason
    });
  }

  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end to capture response
  res.end = async function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    
    // Don't block response, analyze asynchronously
    setImmediate(async () => {
      try {
        const userInfo = extractUserInfo(req);
        
        // Only monitor authenticated requests
        if (!userInfo) return;
        
        const action = getActionType(req);
        
        // Analyze the activity
        await aiSecurityService.analyzeActivity({
          ...userInfo,
          action,
          endpoint: req.originalUrl || req.path,
          method: req.method,
          ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
          requestBody: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
          affectedRecords: res.locals?.recordCount,
          previousValue: res.locals?.previousValue,
          newValue: res.locals?.newValue,
          responseTime: Date.now() - startTime,
          statusCode: res.statusCode
        });
      } catch (error) {
        console.error('Security monitoring error:', error);
      }
    });
  };
  
  next();
};

// Sanitize request body to remove sensitive data
const sanitizeBody = (body) => {
  if (!body) return undefined;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'otp', 'secret', 'creditCard', 'cvv'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Track failed login attempts
const trackFailedLogin = async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = async function(data) {
    // Check if this is a failed login
    if (req.path.includes('login') && (res.statusCode === 401 || data?.success === false)) {
      const email = req.body?.email;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];
      
      if (email) {
        await aiSecurityService.trackFailedLogin(email, ipAddress, userAgent);
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Monitor sensitive operations
const monitorSensitiveOps = (operationType) => {
  return async (req, res, next) => {
    // Store operation context for later analysis
    res.locals.operationType = operationType;
    res.locals.operationStart = Date.now();
    
    next();
  };
};

// Rate limiting with security alerts
const securityRateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return async (req, res, next) => {
    const userInfo = extractUserInfo(req);
    if (!userInfo) return next();
    
    const key = `${userInfo.userId}-${req.path}`;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key).filter(t => t > now - windowMs);
    userRequests.push(now);
    requests.set(key, userRequests);
    
    if (userRequests.length > maxRequests) {
      // Log security alert for rate limit violation
      await aiSecurityService.createAlert({
        ...userInfo,
        activityType: 'api_abuse',
        severity: userRequests.length > maxRequests * 2 ? 'high' : 'medium',
        confidenceScore: 90,
        description: `Rate limit exceeded: ${userRequests.length} requests in ${windowMs/1000}s`,
        details: {
          endpoint: req.path,
          requestCount: userRequests.length,
          timeWindow: `${windowMs/1000} seconds`
        }
      });
      
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down.'
      });
    }
    
    next();
  };
};

module.exports = {
  securityMonitor,
  trackFailedLogin,
  monitorSensitiveOps,
  securityRateLimit,
  checkBlockedIP,
  checkSuspendedUser
};

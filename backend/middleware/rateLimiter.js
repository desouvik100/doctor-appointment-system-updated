
const rateLimitStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,      
   maxRequests = 100,          
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  // @deprecated - use new API
    onLimitReached = null
  } = options;

  return (req, res, next) => {
    if (process.env.PERFORMANCE_TEST === 'true') {
      return next();
    }
    
    const key = keyGenerator(req);
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + windowMs
     };
   }

    record.count++;
    rateLimitStore.set(key, record);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      if (onLimitReached) {
        onLimitReached(req, res);
      }

      return res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalEnd = res.end;
      res.end = function(...args) {
        if ((skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400)) {
          record.count--;
          rateLimitStore.set(key, record);
        }
        originalEnd.apply(res, args);
      };
   }

    next();
  };
};

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  
  maxRequests: 5,             
  message: 'Too many login attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => `login:${req.ip}:${req.body?.email || 'unknown'}`,
  skipSuccessfulRequests: true,
  onLimitReached: (req) => {
    console.warn(`🚨 Login rate limit reached: IP=${req.ip}, Email=${req.body?.email}`);
  }
});
 
const otpLimiter = createRateLimiter({
  windowMs: 60 * 1000,       
  maxRequests: 3,             
  message: 'Too many OTP requests. Please wait before requesting again.',
  keyGenerator: (req) => `otp:${req.ip}:${req.body?.phone || req.body?.email || 'unknown'}`
});

const bookingLimiter = createRateLimiter({
  windowMs: 60 * 1000,       
  maxRequests: 10,            
  message: 'Too many booking requests. Please slow down.',
  keyGenerator: (req) => `booking:${req.userId || req.ip}`
});

const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,       
  maxRequests: 100,           
  message: 'API rate limit exceeded. Please try again later.',
  keyGenerator: (req) => `api:${req.userId || req.ip}`
});

const paymentLimiter = createRateLimiter({
  windowMs: 60 * 1000,       
  maxRequests: 5,             
  message: 'Too many payment attempts. Please wait before trying again.',
  keyGenerator: (req) => `payment:${req.userId || req.ip}`
});

const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,  
  maxRequests: 5,             
  message: 'Too many registration attempts. Please try again later.',
  keyGenerator: (req) => `register:${req.ip}`
});

const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,       
  maxRequests: 30,            
  message: 'Too many search requests. Please slow down.',
  keyGenerator: (req) => `search:${req.userId || req.ip}`
});

const slotCheckLimiter = createRateLimiter({
  windowMs: 10 * 1000,       
  maxRequests: 20,            
  message: 'Too many slot availability checks.',
  keyGenerator: (req) => `slot:${req.userId || req.ip}`
}); 

module.exports = {
  createRateLimiter,
  loginLimiter,
  otpLimiter,
  bookingLimiter,
  apiLimiter,
  paymentLimiter,
  registrationLimiter,
  searchLimiter,
  slotCheckLimiter
};

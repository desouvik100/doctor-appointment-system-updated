/**
 * Rate Limiting Middleware
 * Protects against brute force and DDoS attacks
 */

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Create rate limiter middleware
 * @param {Object} options - Rate limit options
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,      // 1 minute window
    maxRequests = 100,          // Max requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    onLimitReached = null
  } = options;

  return (req, res, next) => {
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

    // Set rate limit headers
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

    // Handle skip options
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

// Pre-configured rate limiters for common use cases

/**
 * Login rate limiter - Strict limits to prevent brute force
 */
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 5,             // 5 attempts
  message: 'Too many login attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => `login:${req.ip}:${req.body?.email || 'unknown'}`,
  skipSuccessfulRequests: true,
  onLimitReached: (req) => {
    console.warn(`🚨 Login rate limit reached: IP=${req.ip}, Email=${req.body?.email}`);
  }
});

/**
 * OTP rate limiter - Prevent OTP spam
 */
const otpLimiter = createRateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 3,             // 3 OTPs per minute
  message: 'Too many OTP requests. Please wait before requesting again.',
  keyGenerator: (req) => `otp:${req.ip}:${req.body?.phone || req.body?.email || 'unknown'}`
});

/**
 * Booking rate limiter - Prevent booking spam
 */
const bookingLimiter = createRateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 10,            // 10 booking attempts per minute
  message: 'Too many booking requests. Please slow down.',
  keyGenerator: (req) => `booking:${req.userId || req.ip}`
});

/**
 * API rate limiter - General API protection
 */
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 100,           // 100 requests per minute
  message: 'API rate limit exceeded. Please try again later.',
  keyGenerator: (req) => `api:${req.userId || req.ip}`
});

/**
 * Payment rate limiter - Strict limits for payment endpoints
 */
const paymentLimiter = createRateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 5,             // 5 payment attempts per minute
  message: 'Too many payment attempts. Please wait before trying again.',
  keyGenerator: (req) => `payment:${req.userId || req.ip}`
});

/**
 * Registration rate limiter
 */
const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 5,             // 5 registrations per hour per IP
  message: 'Too many registration attempts. Please try again later.',
  keyGenerator: (req) => `register:${req.ip}`
});

/**
 * Search rate limiter - Prevent search abuse
 */
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 30,            // 30 searches per minute
  message: 'Too many search requests. Please slow down.',
  keyGenerator: (req) => `search:${req.userId || req.ip}`
});

/**
 * Slot check rate limiter - For real-time availability checks
 */
const slotCheckLimiter = createRateLimiter({
  windowMs: 10 * 1000,       // 10 seconds
  maxRequests: 20,            // 20 checks per 10 seconds
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

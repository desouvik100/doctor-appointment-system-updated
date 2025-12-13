/**
 * Middleware Index
 * Central export for all middleware
 */

// Role-based access control
const {
  authenticate,
  checkRole,
  checkMinRole,
  checkClinicAccess,
  checkOwnership,
  requireAuth,
  ROLE_HIERARCHY
} = require('./roleMiddleware');

// Error handling
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFoundHandler
} = require('./errorHandler');

// Input validation
const {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  schemas,
  rules,
  sanitize
} = require('./validation');

// Rate limiting
const {
  createRateLimiter,
  loginLimiter,
  otpLimiter,
  bookingLimiter,
  apiLimiter,
  paymentLimiter,
  registrationLimiter,
  searchLimiter,
  slotCheckLimiter
} = require('./rateLimiter');

module.exports = {
  // Auth & Roles
  authenticate,
  checkRole,
  checkMinRole,
  checkClinicAccess,
  checkOwnership,
  requireAuth,
  ROLE_HIERARCHY,

  // Errors
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFoundHandler,

  // Validation
  validate,
  validateBody,
  validateQuery,
  validateParams,
  schemas,
  rules,
  sanitize,

  // Rate Limiting
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


const {
  authenticate,
  checkRole,
  checkMinRole,
  checkClinicAccess,
  checkOwnership,
  requireAuth,
  ROLE_HIERARCHY
} = require('./roleMiddleware');
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
const {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  schemas,
  rules,
  sanitize
} = require('./validation');
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
  authenticate,
  checkRole,
  checkMinRole,
  checkClinicAccess,
  checkOwnership,
  requireAuth,
  ROLE_HIERARCHY,
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
  validate,
  validateBody,
  validateQuery,
  validateParams,
  schemas,
  rules,
  sanitize,
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

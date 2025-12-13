/**
 * Centralized Error Handling Middleware
 * Single place for all error handling logic
 */

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, errorCode = 'UNKNOWN_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMITED');
  }
}

// Error response formatter
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    error: error.errorCode || 'SERVER_ERROR',
    message: error.message || 'An unexpected error occurred'
  };

  if (error.details) {
    response.details = error.details;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('❌ Error:', {
    message: err.message,
    code: err.errorCode || err.code,
    path: req.path,
    method: req.method,
    userId: req.userId,
    timestamp: new Date().toISOString()
  });

  // Default values
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'SERVER_ERROR';
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose validation error
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map(e => e.message).join(', ');
  } else if (err.name === 'CastError') {
    // Invalid MongoDB ObjectId
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate entry';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Session expired. Please login again.';
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred. Please try again later.';
  }

  const response = formatErrorResponse({
    errorCode,
    message,
    details: err.details
  }, process.env.NODE_ENV !== 'production');

  res.status(statusCode).json(response);
};

// Async handler wrapper - eliminates try-catch in every route
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl}`));
};

module.exports = {
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
  formatErrorResponse
};

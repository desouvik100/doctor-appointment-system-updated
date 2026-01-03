/**
 * Request Validation Middleware
 * Production-ready input validation and sanitization
 */

const mongoose = require('mongoose');

/**
 * Sanitize string input - remove potential XSS and injection attacks
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip MongoDB operators
      if (key.startsWith('$')) continue;
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         new mongoose.Types.ObjectId(id).toString() === id;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone?.replace(/\D/g, ''));
};

/**
 * Middleware to sanitize all request inputs
 */
const sanitizeInputs = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

/**
 * Validate appointment booking request
 */
const validateAppointmentBooking = (req, res, next) => {
  const { userId, doctorId, clinicId, date, time, consultationType } = req.body;
  const errors = [];

  // Required fields
  if (!userId || !isValidObjectId(userId)) {
    errors.push({ field: 'userId', message: 'Valid userId is required' });
  }
  if (!doctorId || !isValidObjectId(doctorId)) {
    errors.push({ field: 'doctorId', message: 'Valid doctorId is required' });
  }
  if (!clinicId || !isValidObjectId(clinicId)) {
    errors.push({ field: 'clinicId', message: 'Valid clinicId is required' });
  }
  if (!date) {
    errors.push({ field: 'date', message: 'Date is required' });
  } else {
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      errors.push({ field: 'date', message: 'Cannot book appointments in the past' });
    }
  }
  if (!time) {
    errors.push({ field: 'time', message: 'Time is required' });
  }
  if (!consultationType || !['in_person', 'online'].includes(consultationType)) {
    errors.push({ field: 'consultationType', message: 'Valid consultationType (in_person or online) is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors
    });
  }

  next();
};

/**
 * Validate user registration request
 */
const validateUserRegistration = (req, res, next) => {
  const { name, email, phone, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }
  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!phone || !isValidPhone(phone)) {
    errors.push({ field: 'phone', message: 'Valid 10-digit phone number is required' });
  }
  if (!password || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors
    });
  }

  next();
};

/**
 * Validate ObjectId parameter
 */
const validateObjectIdParam = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
        code: 'VALIDATION_ERROR',
        errors: [{ field: paramName, message: `Invalid ${paramName} format` }]
      });
    }
    next();
  };
};

/**
 * Validate data ownership - ensure user can only access their own data
 */
const validateDataOwnership = (model, userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user?.id || req.user?.userId;
      const userRole = req.user?.role;

      // Admins can access all data
      if (userRole === 'admin') {
        return next();
      }

      if (!resourceId || !isValidObjectId(resourceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid resource ID'
        });
      }

      const Model = require(`../models/${model}`);
      const resource = await Model.findById(resourceId).lean();

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check ownership
      const resourceUserId = resource[userIdField]?.toString();
      if (resourceUserId !== userId?.toString()) {
        // For doctors, check if they own the resource via doctorId
        if (userRole === 'doctor' && resource.doctorId?.toString() === userId?.toString()) {
          return next();
        }
        // For clinic staff, check clinic isolation
        if (['receptionist', 'clinic_staff'].includes(userRole)) {
          const userClinicId = req.user?.clinicId?.toString();
          if (resource.clinicId?.toString() === userClinicId) {
            return next();
          }
        }
        
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only access your own data'
        });
      }

      next();
    } catch (error) {
      console.error('Data ownership validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during validation'
      });
    }
  };
};

module.exports = {
  sanitizeInputs,
  sanitizeString,
  sanitizeObject,
  isValidObjectId,
  isValidEmail,
  isValidPhone,
  validateAppointmentBooking,
  validateUserRegistration,
  validateObjectIdParam,
  validateDataOwnership
};

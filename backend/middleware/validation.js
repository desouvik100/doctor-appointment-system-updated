/**
 * Input Validation Middleware
 * Schema-based validation using custom validators
 */

const { ValidationError } = require('./errorHandler');

// Common validation patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,  // Indian phone number
  objectId: /^[0-9a-fA-F]{24}$/,
  time24: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  date: /^\d{4}-\d{2}-\d{2}$/
};

// Validation rules
const rules = {
  required: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  string: (value, fieldName) => {
    if (value !== undefined && typeof value !== 'string') {
      return `${fieldName} must be a string`;
    }
    return null;
  },

  number: (value, fieldName) => {
    if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  email: (value, fieldName) => {
    if (value && !PATTERNS.email.test(value)) {
      return `${fieldName} must be a valid email`;
    }
    return null;
  },

  phone: (value, fieldName) => {
    if (value && !PATTERNS.phone.test(value.replace(/\D/g, ''))) {
      return `${fieldName} must be a valid 10-digit phone number`;
    }
    return null;
  },

  objectId: (value, fieldName) => {
    if (value && !PATTERNS.objectId.test(value)) {
      return `${fieldName} must be a valid ID`;
    }
    return null;
  },

  minLength: (min) => (value, fieldName) => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value, fieldName) => {
    if (value && value.length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return null;
  },

  min: (min) => (value, fieldName) => {
    if (value !== undefined && value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  max: (max) => (value, fieldName) => {
    if (value !== undefined && value > max) {
      return `${fieldName} must be at most ${max}`;
    }
    return null;
  },

  enum: (allowedValues) => (value, fieldName) => {
    if (value && !allowedValues.includes(value)) {
      return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
    }
    return null;
  },

  date: (value, fieldName) => {
    if (value && !PATTERNS.date.test(value)) {
      return `${fieldName} must be a valid date (YYYY-MM-DD)`;
    }
    return null;
  },

  time: (value, fieldName) => {
    if (value && !PATTERNS.time24.test(value)) {
      return `${fieldName} must be a valid time (HH:MM)`;
    }
    return null;
  },

  futureDate: (value, fieldName) => {
    if (value) {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return `${fieldName} must be a future date`;
      }
    }
    return null;
  },

  array: (value, fieldName) => {
    if (value !== undefined && !Array.isArray(value)) {
      return `${fieldName} must be an array`;
    }
    return null;
  },

  boolean: (value, fieldName) => {
    if (value !== undefined && typeof value !== 'boolean') {
      return `${fieldName} must be a boolean`;
    }
    return null;
  }
};

/**
 * Create validation middleware from schema
 * @param {Object} schema - Validation schema
 * @param {string} source - 'body', 'query', or 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const errors = [];

    for (const [field, fieldRules] of Object.entries(schema)) {
      const value = data[field];
      const fieldName = fieldRules.label || field;

      for (const rule of fieldRules.rules || []) {
        let error;
        if (typeof rule === 'function') {
          error = rule(value, fieldName);
        } else if (typeof rule === 'string' && rules[rule]) {
          error = rules[rule](value, fieldName);
        }

        if (error) {
          errors.push({ field, message: error });
          break; // Stop at first error for this field
        }
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Validation failed', errors));
    }

    next();
  };
};

// Pre-built validation schemas
const schemas = {
  // Appointment booking
  createAppointment: {
    doctorId: { rules: ['required', 'objectId'], label: 'Doctor' },
    date: { rules: ['required', 'date', 'futureDate'], label: 'Appointment date' },
    consultationType: { rules: ['required', rules.enum(['video', 'in-clinic', 'clinic'])], label: 'Consultation type' },
    reason: { rules: [rules.maxLength(500)], label: 'Reason' }
  },

  // User registration
  register: {
    name: { rules: ['required', 'string', rules.minLength(2), rules.maxLength(100)], label: 'Name' },
    email: { rules: ['required', 'email'], label: 'Email' },
    password: { rules: ['required', rules.minLength(6)], label: 'Password' },
    phone: { rules: ['phone'], label: 'Phone number' }
  },

  // Login
  login: {
    email: { rules: ['required', 'email'], label: 'Email' },
    password: { rules: ['required'], label: 'Password' }
  },

  // Payment
  payment: {
    appointmentId: { rules: ['required', 'objectId'], label: 'Appointment' },
    amount: { rules: ['required', 'number', rules.min(1)], label: 'Amount' }
  },

  // Doctor schedule
  schedule: {
    doctorId: { rules: ['required', 'objectId'], label: 'Doctor' },
    date: { rules: ['required', 'date'], label: 'Date' }
  },

  // Slot booking
  bookSlot: {
    slotId: { rules: ['required', 'objectId'], label: 'Slot' },
    patientId: { rules: ['objectId'], label: 'Patient' }
  },

  // Commission config
  commissionConfig: {
    onlineCommissionPercent: { rules: ['number', rules.min(0), rules.max(100)], label: 'Online commission' },
    clinicCommissionFlat: { rules: ['number', rules.min(0)], label: 'Clinic commission' },
    gstPercent: { rules: ['number', rules.min(0), rules.max(100)], label: 'GST percent' }
  },

  // Pagination
  pagination: {
    page: { rules: ['number', rules.min(1)], label: 'Page' },
    limit: { rules: ['number', rules.min(1), rules.max(100)], label: 'Limit' }
  }
};

// Middleware factory for common schemas
const validateBody = (schemaName) => validate(schemas[schemaName], 'body');
const validateQuery = (schemaName) => validate(schemas[schemaName], 'query');
const validateParams = (schemaName) => validate(schemas[schemaName], 'params');

// Sanitize input - remove dangerous characters
const sanitize = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove potential XSS characters
      return value.replace(/[<>]/g, '').trim();
    }
    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        value[key] = sanitizeValue(value[key]);
      }
    }
    return value;
  };

  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  
  next();
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  schemas,
  rules,
  sanitize,
  PATTERNS
};

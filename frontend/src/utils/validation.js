// frontend/src/utils/validation.js
// Form validation utilities

/**
 * Validation rules and helpers
 */

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Indian format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone?.replace(/\D/g, ''));
};

// Password strength validation
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    strength: 'weak',
    errors: [],
    score: 0
  };

  if (!password) {
    result.errors.push('Password is required');
    return result;
  }

  if (password.length < 8) {
    result.errors.push('Password must be at least 8 characters');
  } else {
    result.score += 1;
  }

  if (!/[a-z]/.test(password)) {
    result.errors.push('Include at least one lowercase letter');
  } else {
    result.score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    result.errors.push('Include at least one uppercase letter');
  } else {
    result.score += 1;
  }

  if (!/\d/.test(password)) {
    result.errors.push('Include at least one number');
  } else {
    result.score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Include at least one special character');
  } else {
    result.score += 1;
  }

  result.isValid = result.errors.length === 0;
  result.strength = result.score <= 2 ? 'weak' : result.score <= 3 ? 'medium' : 'strong';

  return result;
};

// Name validation
export const isValidName = (name) => {
  if (!name || name.trim().length < 2) return false;
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name.trim());
};

// Date validation (not in past)
export const isValidFutureDate = (date) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

// Age validation
export const isValidAge = (age, min = 0, max = 120) => {
  const numAge = parseInt(age);
  return !isNaN(numAge) && numAge >= min && numAge <= max;
};

// OTP validation
export const isValidOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Form field validator
 * @param {object} fields - Object with field names and values
 * @param {object} rules - Validation rules for each field
 * @returns {object} - { isValid, errors }
 */
export const validateForm = (fields, rules) => {
  const errors = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const fieldRules = rules[fieldName];
    if (!fieldRules) continue;
    
    const fieldErrors = [];
    
    // Required check
    if (fieldRules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      fieldErrors.push(fieldRules.requiredMessage || `${fieldName} is required`);
    }
    
    // Skip other validations if empty and not required
    if (!value && !fieldRules.required) continue;
    
    // Min length
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      fieldErrors.push(`Must be at least ${fieldRules.minLength} characters`);
    }
    
    // Max length
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      fieldErrors.push(`Must be no more than ${fieldRules.maxLength} characters`);
    }
    
    // Email
    if (fieldRules.email && !isValidEmail(value)) {
      fieldErrors.push('Please enter a valid email address');
    }
    
    // Phone
    if (fieldRules.phone && !isValidPhone(value)) {
      fieldErrors.push('Please enter a valid 10-digit phone number');
    }
    
    // Pattern
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      fieldErrors.push(fieldRules.patternMessage || 'Invalid format');
    }
    
    // Custom validator
    if (fieldRules.custom) {
      const customResult = fieldRules.custom(value, fields);
      if (customResult !== true) {
        fieldErrors.push(customResult);
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Get first error message for a field
 */
export const getFieldError = (errors, fieldName) => {
  return errors[fieldName]?.[0] || null;
};

/**
 * Check if field has error
 */
export const hasFieldError = (errors, fieldName) => {
  return !!errors[fieldName]?.length;
};

export default {
  isValidEmail,
  isValidPhone,
  validatePassword,
  isValidName,
  isValidFutureDate,
  isValidAge,
  isValidOTP,
  validateForm,
  getFieldError,
  hasFieldError
};

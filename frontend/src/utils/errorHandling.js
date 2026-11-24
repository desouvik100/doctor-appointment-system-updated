/**
 * Global Error Handling Utilities
 * Centralized error management for the HealthSync frontend
 */

import toast from 'react-hot-toast';

/**
 * Parse API error into a user-friendly message
 */
export const parseApiError = (error) => {
  if (!error) return 'Something went wrong. Please try again.';

  // Axios error with response
  if (error.response) {
    const { status, data } = error.response;

    // Use server-provided message if available
    const serverMessage = data?.message || data?.error || data?.msg;

    switch (status) {
      case 400:
        return serverMessage || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please log in again.';
      case 403:
        return serverMessage || 'You do not have permission to perform this action.';
      case 404:
        return serverMessage || 'The requested resource was not found.';
      case 409:
        return serverMessage || 'This action conflicts with existing data.';
      case 422:
        return serverMessage || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Our team has been notified. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again in a few minutes.';
      default:
        return serverMessage || `Request failed (${status}). Please try again.`;
    }
  }

  // Network error
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.';
  }

  if (error.message === 'Network Error' || !navigator.onLine) {
    return 'No internet connection. Please check your network.';
  }

  return error.message || 'Something went wrong. Please try again.';
};

/**
 * Show error toast with parsed message
 */
export const showError = (error, fallback = 'Something went wrong') => {
  const message = typeof error === 'string' ? error : parseApiError(error) || fallback;
  toast.error(message, {
    duration: 4000,
    style: {
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    },
  });
  return message;
};

/**
 * Show success toast
 */
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    style: {
      background: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },
  });
};

/**
 * Show info toast
 */
export const showInfo = (message) => {
  toast(message, {
    duration: 3000,
    icon: 'ℹ️',
    style: {
      background: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
    },
  });
};

/**
 * Show warning toast
 */
export const showWarning = (message) => {
  toast(message, {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: '#fffbeb',
      color: '#92400e',
      border: '1px solid #fde68a',
    },
  });
};

/**
 * Handle async operations with loading state
 */
export const withLoading = async (asyncFn, setLoading, onError = null) => {
  setLoading(true);
  try {
    const result = await asyncFn();
    return result;
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      showError(error);
    }
    return null;
  } finally {
    setLoading(false);
  }
};

/**
 * Validate form fields
 */
export const validateForm = (fields) => {
  const errors = {};

  Object.entries(fields).forEach(([key, config]) => {
    const { value, rules = [] } = config;

    for (const rule of rules) {
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[key] = rule.message || `${key} is required`;
        break;
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        errors[key] = rule.message || `${key} must be at least ${rule.minLength} characters`;
        break;
      }

      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors[key] = rule.message || `${key} must be at most ${rule.maxLength} characters`;
        break;
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[key] = rule.message || `${key} is invalid`;
        break;
      }

      if (rule.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[key] = rule.message || 'Please enter a valid email address';
        break;
      }

      if (rule.phone && value && !/^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))) {
        errors[key] = rule.message || 'Please enter a valid 10-digit Indian phone number';
        break;
      }

      if (rule.match && value !== rule.match) {
        errors[key] = rule.message || `${key} does not match`;
        break;
      }

      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors[key] = customError;
          break;
        }
      }
    }
  });

  return { isValid: Object.keys(errors).length === 0, errors };
};

/**
 * Password strength checker
 */
export const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  const checks = {
    length: password.length >= 8,
    longLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  if (checks.length) score++;
  if (checks.longLength) score++;
  if (checks.uppercase) score++;
  if (checks.lowercase) score++;
  if (checks.numbers) score++;
  if (checks.special) score++;

  const levels = [
    { min: 0, max: 1, label: 'Very Weak', color: '#ef4444' },
    { min: 2, max: 2, label: 'Weak', color: '#f97316' },
    { min: 3, max: 3, label: 'Fair', color: '#eab308' },
    { min: 4, max: 4, label: 'Good', color: '#22c55e' },
    { min: 5, max: 6, label: 'Strong', color: '#16a34a' },
  ];

  const level = levels.find((l) => score >= l.min && score <= l.max) || levels[0];

  return {
    score,
    maxScore: 6,
    percentage: Math.round((score / 6) * 100),
    label: level.label,
    color: level.color,
    checks,
  };
};

export default {
  parseApiError,
  showError,
  showSuccess,
  showInfo,
  showWarning,
  withLoading,
  validateForm,
  checkPasswordStrength,
};

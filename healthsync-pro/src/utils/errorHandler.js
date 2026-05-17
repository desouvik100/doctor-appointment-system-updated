/**
 * Global Error Handler - Prevents red screen crashes
 */

/**
 * Handle API errors safely
 */
export const handleApiError = (error) => {
  if (__DEV__) {
    console.log('API Error:', error?.response?.data || error?.message);
  }

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message;

    switch (status) {
      case 400:
        return message || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'Access denied.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return message || 'Something went wrong.';
    }
  }

  if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  }

  // Something else happened
  return 'An unexpected error occurred.';
};

/**
 * Safe console log - only in dev mode
 */
export const devLog = (...args) => {
  if (__DEV__) {
    console.log(...args);
  }
};

/**
 * Safe console error - only in dev mode
 */
export const devError = (...args) => {
  if (__DEV__) {
    console.error(...args);
  }
};

/**
 * Wrap async function with error handling
 */
export const safeAsync = async (asyncFn, fallback = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    devError('SafeAsync Error:', error);
    return fallback;
  }
};

/**
 * Check if value is valid (not null, undefined, or empty)
 */
export const isValid = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

export default {
  handleApiError,
  devLog,
  devError,
  safeAsync,
  isValid,
};

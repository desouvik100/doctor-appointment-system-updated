// frontend/src/utils/errorHandler.js
// Centralized Error Handling Service

import toast from 'react-hot-toast';

// Error types for categorization
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

// User-friendly error messages
const errorMessages = {
  [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
  [ErrorTypes.AUTH]: 'Your session has expired. Please log in again.',
  [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
  [ErrorTypes.SERVER]: 'Something went wrong on our end. Please try again later.',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorTypes.TIMEOUT]: 'Request timed out. Please try again.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * Categorize error based on response/error type
 */
export function categorizeError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return ErrorTypes.TIMEOUT;
    if (error.message === 'Network Error') return ErrorTypes.NETWORK;
    return ErrorTypes.UNKNOWN;
  }

  const status = error.response.status;
  
  if (status === 401 || status === 403) return ErrorTypes.AUTH;
  if (status === 400 || status === 422) return ErrorTypes.VALIDATION;
  if (status === 404) return ErrorTypes.NOT_FOUND;
  if (status >= 500) return ErrorTypes.SERVER;
  
  return ErrorTypes.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error) {
  const type = categorizeError(error);
  
  // Check for custom message from server
  const serverMessage = error.response?.data?.message;
  if (serverMessage && type === ErrorTypes.VALIDATION) {
    return serverMessage;
  }
  
  return errorMessages[type];
}

/**
 * Handle API error with toast notification
 */
export function handleApiError(error, customMessage = null) {
  const message = customMessage || getErrorMessage(error);
  const type = categorizeError(error);
  
  // Log error for debugging
  console.error('API Error:', {
    type,
    message: error.message,
    response: error.response?.data,
    status: error.response?.status
  });
  
  // Show appropriate toast
  if (type === ErrorTypes.AUTH) {
    toast.error(message, { 
      id: 'auth-error',
      duration: 5000,
      icon: '🔒'
    });
  } else if (type === ErrorTypes.NETWORK) {
    toast.error(message, { 
      id: 'network-error',
      duration: 4000,
      icon: '📡'
    });
  } else {
    toast.error(message, { duration: 4000 });
  }
  
  return { type, message };
}

/**
 * Retry wrapper for API calls
 */
export async function withRetry(apiCall, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      const type = categorizeError(error);
      
      // Don't retry auth or validation errors
      if (type === ErrorTypes.AUTH || type === ErrorTypes.VALIDATION) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}

/**
 * Check if user is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Setup offline detection listeners
 */
export function setupOfflineDetection(onOffline, onOnline) {
  const handleOffline = () => {
    toast.error('You are offline. Some features may not work.', {
      id: 'offline-toast',
      duration: Infinity,
      icon: '📡'
    });
    onOffline?.();
  };
  
  const handleOnline = () => {
    toast.dismiss('offline-toast');
    toast.success('You are back online!', { duration: 3000 });
    onOnline?.();
  };
  
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
  };
}

export default {
  ErrorTypes,
  categorizeError,
  getErrorMessage,
  handleApiError,
  withRetry,
  isOnline,
  setupOfflineDetection
};

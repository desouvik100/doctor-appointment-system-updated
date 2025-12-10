/**
 * Centralized API Error Handler
 * Provides consistent error handling across the application
 */

import toast from 'react-hot-toast';

// Error types for categorization
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// User-friendly error messages
const errorMessages = {
  [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
  [ErrorTypes.AUTH]: 'Session expired. Please login again.',
  [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorTypes.SERVER]: 'Something went wrong on our end. Please try again later.',
  [ErrorTypes.TIMEOUT]: 'Request timed out. Please try again.',
  [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please wait a moment.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * Categorize error based on response
 */
export const categorizeError = (error) => {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return ErrorTypes.TIMEOUT;
    if (error.message === 'Network Error') return ErrorTypes.NETWORK;
    return ErrorTypes.NETWORK;
  }

  const status = error.response.status;
  
  if (status === 401 || status === 403) return ErrorTypes.AUTH;
  if (status === 400 || status === 422) return ErrorTypes.VALIDATION;
  if (status === 404) return ErrorTypes.NOT_FOUND;
  if (status === 429) return ErrorTypes.RATE_LIMIT;
  if (status >= 500) return ErrorTypes.SERVER;
  
  return ErrorTypes.UNKNOWN;
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  const errorType = categorizeError(error);
  
  // Check for custom message from server
  const serverMessage = error.response?.data?.message;
  
  // For validation errors, prefer server message
  if (errorType === ErrorTypes.VALIDATION && serverMessage) {
    return serverMessage;
  }
  
  // For auth errors, check for specific messages
  if (errorType === ErrorTypes.AUTH) {
    if (error.response?.data?.suspended) {
      return `Account suspended: ${error.response.data.reason || 'Contact support'}`;
    }
    return serverMessage || errorMessages[errorType];
  }
  
  return serverMessage || errorMessages[errorType];
};

/**
 * Handle API error with toast notification
 */
export const handleApiError = (error, options = {}) => {
  const {
    showToast = true,
    defaultMessage = null,
    onAuthError = null,
    onNetworkError = null
  } = options;

  const errorType = categorizeError(error);
  const message = defaultMessage || getErrorMessage(error);

  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      type: errorType,
      message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
  }

  // Handle specific error types
  if (errorType === ErrorTypes.AUTH && onAuthError) {
    onAuthError(error);
  }

  if (errorType === ErrorTypes.NETWORK && onNetworkError) {
    onNetworkError(error);
  }

  // Show toast notification
  if (showToast) {
    const toastOptions = {
      duration: errorType === ErrorTypes.NETWORK ? 5000 : 4000,
      icon: getErrorIcon(errorType)
    };

    if (errorType === ErrorTypes.NETWORK) {
      toast.error(message, { ...toastOptions, id: 'network-error' });
    } else {
      toast.error(message, toastOptions);
    }
  }

  return { errorType, message };
};

/**
 * Get appropriate icon for error type
 */
const getErrorIcon = (errorType) => {
  switch (errorType) {
    case ErrorTypes.NETWORK: return '📡';
    case ErrorTypes.AUTH: return '🔐';
    case ErrorTypes.TIMEOUT: return '⏱️';
    case ErrorTypes.RATE_LIMIT: return '🚦';
    default: return '❌';
  }
};

/**
 * Retry wrapper for API calls
 */
export const withRetry = async (apiCall, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryOn = [ErrorTypes.NETWORK, ErrorTypes.TIMEOUT, ErrorTypes.SERVER]
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      const errorType = categorizeError(error);
      
      if (!retryOn.includes(errorType) || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Retrying API call (attempt ${attempt + 1}/${maxRetries})...`);
      }
    }
  }
  
  throw lastError;
};

/**
 * Create a safe API call wrapper
 */
export const safeApiCall = async (apiCall, options = {}) => {
  try {
    const response = await apiCall();
    return { success: true, data: response.data, error: null };
  } catch (error) {
    const { errorType, message } = handleApiError(error, options);
    return { success: false, data: null, error: { type: errorType, message } };
  }
};

export default {
  handleApiError,
  getErrorMessage,
  categorizeError,
  withRetry,
  safeApiCall,
  ErrorTypes
};

/**
 * HealthSync Pro — Global Error Handler
 * Prevents red screen crashes and provides consistent error messages
 */

import { Alert } from 'react-native';

// ─── API Error Parser ─────────────────────────────────────────────────────

export const handleApiError = (error) => {
  if (__DEV__) {
    console.log('🔴 [API Error]', {
      status: error?.statusCode || error?.response?.status,
      message: error?.message,
      data: error?.response?.data,
    });
  }

  // Standardized error from apiClient
  if (error?.success === false && error?.message) {
    return error.message;
  }

  // Axios error with response
  if (error?.response) {
    const { status, data } = error.response;
    const serverMsg = data?.message || data?.error || data?.msg;

    switch (status) {
      case 400: return serverMsg || 'Invalid request. Please check your input.';
      case 401: return 'Session expired. Please log in again.';
      case 403: return serverMsg || 'Access denied. You do not have permission.';
      case 404: return serverMsg || 'Resource not found.';
      case 408: return 'Request timed out. Please try again.';
      case 409: return serverMsg || 'Conflict with existing data.';
      case 422: return serverMsg || 'Validation failed. Please check your input.';
      case 429: return 'Too many requests. Please wait and try again.';
      case 500: return 'Server error. Please try again later.';
      case 502: return 'Service temporarily unavailable.';
      case 503: return 'Service unavailable. Please try again later.';
      default:  return serverMsg || `Request failed (${status}).`;
    }
  }

  // Network / timeout
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Request timed out. The server may be starting up — please wait 30 seconds and try again.';
  }

  if (error?.code === 'ERR_NETWORK' || error?.statusCode === 0) {
    return 'Cannot connect to server. Please check your internet connection.';
  }

  return error?.message || 'Something went wrong. Please try again.';
};

// ─── Alert helpers ────────────────────────────────────────────────────────

export const showErrorAlert = (error, title = 'Error') => {
  const message = typeof error === 'string' ? error : handleApiError(error);
  Alert.alert(title, message, [{ text: 'OK' }]);
};

export const showSuccessAlert = (message, title = 'Success', onPress = null) => {
  Alert.alert(title, message, [{ text: 'OK', onPress }]);
};

export const showConfirmAlert = (title, message, onConfirm, onCancel = null) => {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel', onPress: onCancel },
    { text: 'Confirm', style: 'destructive', onPress: onConfirm },
  ]);
};

// ─── Dev logging ──────────────────────────────────────────────────────────

export const devLog = (...args) => {
  if (__DEV__) console.log(...args);
};

export const devError = (...args) => {
  if (__DEV__) console.error(...args);
};

export const devWarn = (...args) => {
  if (__DEV__) console.warn(...args);
};

// ─── Safe async wrapper ───────────────────────────────────────────────────

export const safeAsync = async (asyncFn, fallback = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    devError('SafeAsync Error:', error);
    return fallback;
  }
};

// ─── Retry with exponential backoff ──────────────────────────────────────

export const retryAsync = async (asyncFn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// ─── Validation helpers ───────────────────────────────────────────────────

export const isValid = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

export const validateRequired = (fields) => {
  const errors = {};
  Object.entries(fields).forEach(([key, value]) => {
    if (!isValid(value)) errors[key] = `${key} is required`;
  });
  return { isValid: Object.keys(errors).length === 0, errors };
};

export default {
  handleApiError,
  showErrorAlert,
  showSuccessAlert,
  showConfirmAlert,
  devLog,
  devError,
  devWarn,
  safeAsync,
  retryAsync,
  isValid,
  validateRequired,
};

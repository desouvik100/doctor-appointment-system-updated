/**
 * API Client - Centralized Axios instance with interceptors
 * 
 * This module provides a standardized API client for the HealthSync mobile app.
 * It ensures consistent behavior with the web application by using identical
 * API contracts and error handling.
 * 
 * Features:
 * - Automatic Authorization header attachment (Requirement 1.2)
 * - Standardized error transformation (Requirement 1.4)
 * - Token refresh on 401 responses (Requirement 1.6)
 * - Prevents red screen crashes with proper error handling
 * - Consistent with web app API layer
 * 
 * @module apiClient
 * @see {@link https://doctor-appointment-system-updated.onrender.com/api/docs} API Documentation
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { API_URL, API_TIMEOUT } from '../../config/env';
import { devLog, devError } from '../../utils/errorHandler';

// API Version for future compatibility
export const API_VERSION = '1.0.0';

// Token storage keys
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Standardized API Error structure
 * @typedef {Object} StandardizedError
 * @property {boolean} success - Always false for errors
 * @property {string} message - Human-readable error message
 * @property {number} statusCode - HTTP status code (0 for network errors, -1 for unknown)
 * @property {string} [code] - Optional error code from backend
 * @property {Array<{field: string, message: string}>} [errors] - Field-specific validation errors
 * @property {Error} originalError - The original error object
 */

/**
 * Transform any error into a standardized error format
 * Ensures consistent error structure across all API calls
 * 
 * @param {Error} error - The original error from axios or other source
 * @returns {StandardizedError} Standardized error object
 */
const transformError = (error) => {
  // Server responded with an error status
  if (error.response) {
    const { status, data } = error.response;
    return {
      success: false,
      message: data?.message || getDefaultErrorMessage(status),
      statusCode: status,
      code: data?.code || undefined,
      errors: data?.errors || [],
      originalError: error,
    };
  }

  // Request was made but no response received (network error)
  if (error.request) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      statusCode: 0,
      code: 'NETWORK_ERROR',
      errors: [],
      originalError: error,
    };
  }

  // Something else happened during request setup
  return {
    success: false,
    message: error.message || 'An unexpected error occurred.',
    statusCode: -1,
    code: 'UNKNOWN_ERROR',
    errors: [],
    originalError: error,
  };
};

/**
 * Get default error message based on HTTP status code
 * 
 * @param {number} status - HTTP status code
 * @returns {string} Default error message
 */
const getDefaultErrorMessage = (status) => {
  const messages = {
    400: 'Invalid request. Please check your input.',
    401: 'Session expired. Please login again.',
    403: 'Access denied. You do not have permission.',
    404: 'Resource not found.',
    408: 'Request timeout. Please try again.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please wait and try again.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. Please try again.',
  };
  return messages[status] || 'Something went wrong.';
};

// Create axios instance with centralized configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get auth token from secure storage
 * Attempts Keychain first, falls back to AsyncStorage
 * 
 * @returns {Promise<string|null>} The auth token or null if not found
 */
export const getAuthToken = async () => {
  try {
    // Try Keychain first
    const credentials = await Keychain.getGenericPassword({ service: TOKEN_KEY });
    if (credentials && credentials.password) {
      console.log('🔑 [AUTH] Token found in Keychain');
      return credentials.password;
    }
  } catch (error) {
    console.log('⚠️ [AUTH] Keychain read failed:', error.message);
  }
  
  // Fallback to AsyncStorage
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      console.log('🔑 [AUTH] Token found in AsyncStorage');
      return token;
    }
    // Also try 'token' key (used by UserContext)
    const altToken = await AsyncStorage.getItem('token');
    if (altToken) {
      console.log('🔑 [AUTH] Token found in AsyncStorage (alt key)');
      return altToken;
    }
  } catch (error) {
    console.log('⚠️ [AUTH] AsyncStorage read failed:', error.message);
  }
  
  console.log('❌ [AUTH] No token found');
  return null;
};

/**
 * Save auth token to secure storage
 * 
 * @param {string} token - The JWT token to save
 * @returns {Promise<void>}
 */
export const saveAuthToken = async (token) => {
  console.log('💾 [AUTH] Saving token...');
  try {
    await Keychain.setGenericPassword('authToken', token, { service: TOKEN_KEY });
    console.log('✅ [AUTH] Token saved to Keychain');
  } catch (error) {
    console.log('⚠️ [AUTH] Keychain save failed, using AsyncStorage:', error.message);
    // Fallback to AsyncStorage
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('✅ [AUTH] Token saved to AsyncStorage');
  }
  // Also save to 'token' key for compatibility with UserContext
  await AsyncStorage.setItem('token', token);
};

/**
 * Save refresh token to secure storage
 * 
 * @param {string} token - The refresh token to save
 * @returns {Promise<void>}
 */
export const saveRefreshToken = async (token) => {
  try {
    await Keychain.setGenericPassword('refreshToken', token, { service: REFRESH_TOKEN_KEY });
  } catch (error) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
};

/**
 * Get refresh token from secure storage
 * 
 * @returns {Promise<string|null>} The refresh token or null if not found
 */
export const getRefreshToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_KEY });
    return credentials ? credentials.password : null;
  } catch (error) {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }
};

/**
 * Clear all auth tokens from storage
 * Used during logout or when token refresh fails
 * 
 * @returns {Promise<void>}
 */
export const clearAuthTokens = async () => {
  try {
    await Keychain.resetGenericPassword({ service: TOKEN_KEY });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
  } catch (error) {
    // Ignore keychain errors
  }
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
};

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
// Queue of requests waiting for token refresh
let refreshSubscribers = [];

/**
 * Subscribe to token refresh completion
 * 
 * @param {Function} callback - Callback to execute when refresh completes
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers that token refresh is complete
 * 
 * @param {string} token - The new auth token
 */
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Notify all subscribers that token refresh failed
 * 
 * @param {Error} error - The refresh error
 */
const onTokenRefreshFailed = (error) => {
  refreshSubscribers.forEach((callback) => callback(null, error));
  refreshSubscribers = [];
};

/**
 * Refresh the auth token using the refresh token
 * Handles concurrent refresh requests by queuing them
 * 
 * @returns {Promise<string>} The new auth token
 * @throws {Error} If refresh fails or no refresh token available
 */
const refreshAuthToken = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${API_URL}/auth/refresh`, {
    refreshToken,
  });

  const { token, refreshToken: newRefreshToken } = response.data;
  await saveAuthToken(token);
  if (newRefreshToken) {
    await saveRefreshToken(newRefreshToken);
  }

  return token;
};

/**
 * Request Interceptor
 * Automatically attaches Authorization header with JWT token (Requirement 1.2)
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      
      // DEBUG: Always log request details
      console.log(`🌐 [API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log(`🌐 [API REQUEST] Has Token: ${!!token}`);
      if (config.data) {
        // Don't log password
        const safeData = { ...config.data };
        if (safeData.password) safeData.password = '***';
        console.log(`🌐 [API REQUEST] Body:`, JSON.stringify(safeData));
      }
      
      // Automatically attach Authorization header if token exists
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      devError('Token retrieval error:', error);
    }
    return config;
  },
  (error) => {
    devError('Request interceptor error:', error);
    return Promise.reject(transformError(error));
  }
);

/**
 * Response Interceptor
 * - Handles successful responses
 * - Transforms errors into standardized format (Requirement 1.4)
 * - Implements token refresh on 401 responses (Requirement 1.6)
 */
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      devLog(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in dev mode only
    if (__DEV__) {
      devError(
        `❌ [API] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status || 'NETWORK ERROR'}`,
        error.response?.data?.message || error.message
      );
    }

    // Handle 401 - Token refresh (Requirement 1.6)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints to prevent infinite loops
      if (originalRequest.url?.includes('/auth/login') || 
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(transformError(error));
      }

      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, refreshError) => {
            if (refreshError) {
              reject(transformError(refreshError));
            } else if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            } else {
              reject(transformError(error));
            }
          });
        });
      }

      isRefreshing = true;

      try {
        devLog('🔄 [API] Attempting token refresh...');
        const newToken = await refreshAuthToken();
        devLog('✅ [API] Token refreshed successfully');
        
        isRefreshing = false;
        onTokenRefreshed(newToken);
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        devError('❌ [API] Token refresh failed:', refreshError.message);
        
        isRefreshing = false;
        onTokenRefreshFailed(refreshError);
        
        await clearAuthTokens();
        return Promise.reject(transformError(refreshError));
      }
    }

    // Return standardized error (Requirement 1.4)
    return Promise.reject(transformError(error));
  }
);

/**
 * Safe API call wrapper - prevents crashes and returns standardized response
 * 
 * @template T
 * @param {Function} apiCall - The API call function to execute
 * @param {T} [fallback=null] - Fallback value if call fails
 * @returns {Promise<T|null>} The response data or fallback value
 */
export const safeApiCall = async (apiCall, fallback = null) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    devError('Safe API call failed:', error?.message || error);
    return fallback;
  }
};

/**
 * Check if an error is a standardized API error
 * 
 * @param {any} error - The error to check
 * @returns {boolean} True if error is a standardized API error
 */
export const isApiError = (error) => {
  return (
    error &&
    typeof error === 'object' &&
    error.success === false &&
    typeof error.message === 'string' &&
    typeof error.statusCode === 'number'
  );
};

/**
 * Extract user-friendly message from any error
 * 
 * @param {any} error - The error to extract message from
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred.';
};

/**
 * Get field-specific errors from a validation error
 * 
 * @param {any} error - The error to extract field errors from
 * @returns {Array<{field: string, message: string}>} Array of field errors
 */
export const getFieldErrors = (error) => {
  if (isApiError(error) && Array.isArray(error.errors)) {
    return error.errors;
  }
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors;
  }
  return [];
};

/**
 * Check if error is a network error
 * 
 * @param {any} error - The error to check
 * @returns {boolean} True if error is a network error
 */
export const isNetworkError = (error) => {
  return isApiError(error) && error.statusCode === 0;
};

/**
 * Check if error is an authentication error
 * 
 * @param {any} error - The error to check
 * @returns {boolean} True if error is an auth error (401)
 */
export const isAuthError = (error) => {
  return isApiError(error) && error.statusCode === 401;
};

/**
 * Check if error is a validation error
 * 
 * @param {any} error - The error to check
 * @returns {boolean} True if error is a validation error (400 or 422)
 */
export const isValidationError = (error) => {
  return isApiError(error) && (error.statusCode === 400 || error.statusCode === 422);
};

export default apiClient;

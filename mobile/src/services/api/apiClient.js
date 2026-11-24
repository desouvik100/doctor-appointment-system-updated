

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { API_URL, API_TIMEOUT } from '../../config/env';
import { devLog, devError } from '../../utils/errorHandler';
export const API_VERSION = '1.0.0';
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const transformError = (error) => {
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
  return {
    success: false,
    message: error.message || 'An unexpected error occurred.',
    statusCode: -1,
    code: 'UNKNOWN_ERROR',
    errors: [],
    originalError: error,
  };
};

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
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAuthToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: TOKEN_KEY });
    if (credentials && credentials.password) {
      console.log('🔑 [AUTH] Token found in Keychain');
      return credentials.password;
    }
  } catch (error) {
    console.log('⚠️ [AUTH] Keychain read failed:', error.message);
  }
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      console.log('🔑 [AUTH] Token found in AsyncStorage');
      return token;
    }
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

export const saveAuthToken = async (token) => {
  console.log('💾 [AUTH] Saving token...');
  try {
    await Keychain.setGenericPassword('authToken', token, { service: TOKEN_KEY });
    console.log('✅ [AUTH] Token saved to Keychain');
  } catch (error) {
    console.log('⚠️ [AUTH] Keychain save failed:', error.message);
  }
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('✅ [AUTH] Token saved to AsyncStorage');
  } catch (error) {
    console.log('⚠️ [AUTH] AsyncStorage save failed:', error.message);
  }
  try {
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    console.log('⚠️ [AUTH] AsyncStorage alt key save failed:', error.message);
  }
  try {
    const socketManager = require('./socketManager').default;
    if (socketManager) {
      socketManager.updateToken(token);
    }
  } catch (error) {
    console.log('⚠️ [AUTH] Socket token update skipped:', error.message);
  }
};

export const saveRefreshToken = async (token) => {
  console.log('💾 [AUTH] Saving refresh token...');
  try {
    await Keychain.setGenericPassword('refreshToken', token, { service: REFRESH_TOKEN_KEY });
    console.log('✅ [AUTH] Refresh token saved to Keychain');
  } catch (error) {
    console.log('⚠️ [AUTH] Keychain refresh token save failed:', error.message);
  }
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    console.log('✅ [AUTH] Refresh token saved to AsyncStorage');
  } catch (error) {
    console.log('⚠️ [AUTH] AsyncStorage refresh token save failed:', error.message);
  }
};

export const getRefreshToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_KEY });
    if (credentials && credentials.password) {
      console.log('🔑 [AUTH] Refresh token found in Keychain');
      return credentials.password;
    }
  } catch (error) {
    console.log('⚠️ [AUTH] Keychain refresh token read failed:', error.message);
  }
  try {
    const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (token) {
      console.log('🔑 [AUTH] Refresh token found in AsyncStorage');
      return token;
    }
  } catch (error) {
    console.log('⚠️ [AUTH] AsyncStorage refresh token read failed:', error.message);
  }
  console.log('❌ [AUTH] No refresh token found');
  return null;
};

export const clearAuthTokens = async () => {
  try {
    await Keychain.resetGenericPassword({ service: TOKEN_KEY });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
    console.log('🧹 [AUTH] Cleared tokens from Keychain');
  } catch (error) {
    console.log('⚠️ [AUTH] Keychain reset failed:', error.message);
  }
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem('token');
    console.log('🧹 [AUTH] Cleared tokens from AsyncStorage');
  } catch (error) {
    console.log('⚠️ [AUTH] AsyncStorage remove failed:', error.message);
  }
};

let authFailureCallback = null;

export const setAuthFailureCallback = (callback) => {
  authFailureCallback = callback;
};
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = (error) => {
  refreshSubscribers.forEach((callback) => callback(null, error));
  refreshSubscribers = [];
};

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

const refreshAuthTokenWithTimeout = (timeoutMs = 10000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Token refresh timed out after ' + timeoutMs + 'ms'));
    }, timeoutMs);

    refreshAuthToken()
      .then((token) => {
        clearTimeout(timer);
        resolve(token);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      console.log(`🌐 [API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log(`🌐 [API REQUEST] Has Token: ${!!token}`);
      if (config.data) {
        const safeData = { ...config.data };
        if (safeData.password) safeData.password = '***';
        console.log(`🌐 [API REQUEST] Body:`, JSON.stringify(safeData));
      }
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

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      devLog(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (__DEV__) {
      const isNetworkErr = !error.response && error.request;
      if (isNetworkErr) {
        console.warn(
          `⚠️ [API] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - NETWORK ERROR (offline or server unreachable)`
        );
      } else {
        devError(
          `❌ [API] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status || 'NETWORK ERROR'}`,
          error.response?.data?.message || error.message
        );
      }
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || 
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(transformError(error));
      }

      originalRequest._retry = true;
      if (isRefreshing) {
        if (originalRequest._retryCount && originalRequest._retryCount >= 1) {
          return Promise.reject(transformError(error));
        }
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

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
        devLog('🔄 [API] Attempting token refresh (10s deadline)...');
        const newToken = await refreshAuthTokenWithTimeout(10000);
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
        if (authFailureCallback) {
          authFailureCallback(refreshError.message || 'Session expired');
        }

        return Promise.reject(transformError(refreshError));
      }
    }
    return Promise.reject(transformError(error));
  }
);

export const safeApiCall = async (apiCall, fallback = null) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    devError('Safe API call failed:', error?.message || error);
    return fallback;
  }
};

export const isApiError = (error) => {
  return (
    error &&
    typeof error === 'object' &&
    error.success === false &&
    typeof error.message === 'string' &&
    typeof error.statusCode === 'number'
  );
};

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

export const getFieldErrors = (error) => {
  if (isApiError(error) && Array.isArray(error.errors)) {
    return error.errors;
  }
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors;
  }
  return [];
};

export const isNetworkError = (error) => {
  return isApiError(error) && error.statusCode === 0;
};

export const isAuthError = (error) => {
  return isApiError(error) && error.statusCode === 401;
};

export const isValidationError = (error) => {
  return isApiError(error) && (error.statusCode === 400 || error.statusCode === 422);
};

export default apiClient;

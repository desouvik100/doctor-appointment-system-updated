/**
 * API Client - Axios instance with interceptors for auth
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

// API Base URL - Production
const API_BASE_URL = 'https://doctor-appointment-system-updated.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for Render free tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Get auth token from secure storage
 */
export const getAuthToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: TOKEN_KEY });
    return credentials ? credentials.password : null;
  } catch (error) {
    // Fallback to AsyncStorage if Keychain fails
    return await AsyncStorage.getItem(TOKEN_KEY);
  }
};

/**
 * Save auth token to secure storage
 */
export const saveAuthToken = async (token) => {
  try {
    await Keychain.setGenericPassword('authToken', token, { service: TOKEN_KEY });
  } catch (error) {
    // Fallback to AsyncStorage
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Save refresh token to secure storage
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
 */
export const getRefreshToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_KEY });
    return credentials ? credentials.password : null;
  } catch (error) {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Clear all auth tokens
 */
export const clearAuthTokens = async () => {
  try {
    await Keychain.resetGenericPassword({ service: TOKEN_KEY });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
  } catch (error) {
    // Fallback
  }
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Refresh the auth token
 */
const refreshAuthToken = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  const { token, refreshToken: newRefreshToken } = response.data;
  await saveAuthToken(token);
  if (newRefreshToken) {
    await saveRefreshToken(newRefreshToken);
  }

  return token;
};

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        await clearAuthTokens();
        // Navigation to login will be handled by the app
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

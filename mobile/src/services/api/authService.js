/**
 * Authentication Service - Login, Register, OTP, Password Reset
 */

import apiClient, { 
  saveAuthToken, 
  saveRefreshToken, 
  clearAuthTokens,
  getAuthToken 
} from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const USER_KEY = 'userData';

/**
 * Login with email/phone and password
 * For patients only - uses /auth/login endpoint
 */
export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  const { token, refreshToken, user } = response.data;
  
  await saveAuthToken(token);
  if (refreshToken) {
    await saveRefreshToken(refreshToken);
  }
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return { token, user };
};

/**
 * Doctor login - uses separate doctor endpoint
 * Backend /auth/doctor/login expects { email, password }
 */
export const doctorLogin = async (credentials) => {
  const response = await apiClient.post('/auth/doctor/login', credentials);
  const { token, refreshToken, doctor } = response.data;
  
  await saveAuthToken(token);
  if (refreshToken) {
    await saveRefreshToken(refreshToken);
  }
  // Store doctor as user for consistency
  const user = { ...doctor, role: 'doctor' };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return { token, user };
};

/**
 * Admin login - uses separate admin endpoint
 */
export const adminLogin = async (credentials) => {
  const response = await apiClient.post('/auth/admin/login', credentials);
  const { token, refreshToken, user } = response.data;
  
  await saveAuthToken(token);
  if (refreshToken) {
    await saveRefreshToken(refreshToken);
  }
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return { token, user };
};

/**
 * Clinic/Receptionist/Staff login
 * Uses /auth/clinic/login endpoint for all clinic staff
 */
export const clinicLogin = async (credentials) => {
  const response = await apiClient.post('/auth/clinic/login', credentials);
  const { token, refreshToken, user } = response.data;
  
  await saveAuthToken(token);
  if (refreshToken) {
    await saveRefreshToken(refreshToken);
  }
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return { token, user };
};

/**
 * Staff login - alias for clinicLogin
 * Staff (reception, nursing, pharmacy, lab) use clinic login endpoint
 */
export const staffLogin = async (credentials) => {
  return clinicLogin(credentials);
};

/**
 * Register new user
 */
export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

/**
 * Send OTP to phone number
 */
export const sendOTP = async (phone) => {
  const response = await apiClient.post('/auth/send-otp', { phone });
  return response.data;
};

/**
 * Verify OTP
 */
export const verifyOTP = async (phone, otp) => {
  const response = await apiClient.post('/auth/verify-otp', { phone, otp });
  const { token, refreshToken, user } = response.data;
  
  if (token) {
    await saveAuthToken(token);
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  
  return { token, user };
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', { 
    token, 
    password: newPassword 
  });
  return response.data;
};

/**
 * Google OAuth login
 */
export const googleLogin = async (idToken) => {
  const response = await apiClient.post('/auth/google', { idToken });
  const { token, refreshToken, user } = response.data;
  
  await saveAuthToken(token);
  if (refreshToken) {
    await saveRefreshToken(refreshToken);
  }
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return { token, user };
};

/**
 * Logout - Clear all stored data
 */
export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    // Continue with local logout even if API fails
  }
  
  // Clear auth tokens from secure storage
  await clearAuthTokens();
  
  // Clear user data
  await AsyncStorage.removeItem(USER_KEY);
  
  // Clear biometric credentials
  try {
    await Keychain.resetGenericPassword({ service: 'healthsync_credentials' });
  } catch (error) {
    // Biometric credentials may not exist
  }
  
  // Clear all cached data
  const keys = await AsyncStorage.getAllKeys();
  const keysToRemove = keys.filter(key => 
    key.startsWith('cache_') || 
    key.startsWith('offline_') ||
    key.startsWith('queue_') ||
    key === 'appointments' ||
    key === 'favorites' ||
    key === 'familyMembers' ||
    key === 'healthRecords' ||
    key === 'prescriptions' ||
    key === 'walletData' ||
    key === 'notificationSettings'
  );
  
  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove);
  }
};

/**
 * Get current user from storage
 */
export const getCurrentUser = async () => {
  const userData = await AsyncStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  const response = await apiClient.put('/auth/profile', profileData);
  const { user } = response.data;
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Register device for push notifications
 */
export const registerDeviceToken = async (deviceToken) => {
  const response = await apiClient.post('/auth/device-token', { 
    deviceToken,
    platform: 'android'
  });
  return response.data;
};

export default {
  login,
  doctorLogin,
  adminLogin,
  clinicLogin,
  staffLogin,
  register,
  sendOTP,
  verifyOTP,
  requestPasswordReset,
  resetPassword,
  googleLogin,
  logout,
  getCurrentUser,
  updateProfile,
  isAuthenticated,
  registerDeviceToken,
};

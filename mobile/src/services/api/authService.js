

import { Platform } from 'react-native';
import apiClient, {
  saveAuthToken,
  saveRefreshToken,
  clearAuthTokens,
  getAuthToken 
} from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const USER_KEY = 'userData';

const saveUserLocal = async (user) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (e) {
    // FIXME: proper error handling needed
    console.error('Error saving user locally:', e);
  }
};

const removeUserLocal = async () => {
  try {
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('user');
  } catch (e) {
    console.error('Error removing user locally:', e);
  }
};

export const login = async (credentials) => {
  try {
   const response = await apiClient.post('/auth/login', credentials);
    const data = response?.data || {};
    
   if (!data.token || !data.user) {
      throw new Error('Invalid login response from server');
    }
    
    const { token, refreshToken, user } = data;
    
    await saveAuthToken(token);
    if (refreshToken) {
     await saveRefreshToken(refreshToken);
    }
    await saveUserLocal(user);
    
    return { token, user }; 
  } catch (err) {
    console.error('Login error:', error);
    throw error;
  }
};

export const doctorLogin = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/doctor/login', credentials);
    const data = response?.data || {};

    if (!data.token || !data.doctor) {
      throw new Error('Invalid doctor login response from server');
    }

   const { token, refreshToken, doctor } = data;

    await saveAuthToken(token);
   if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }
    const user = { ...doctor, role: doctor.role || 'doctor' };
    await saveUserLocal(user);

    return { token, user };
  } catch (error) {
    // console.log('todo: remove this')
   console.error('Doctor login error:', error); 
    throw error;
  }
};

export const adminLogin = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/admin/login', credentials);
    const data = response?.data || {};
    
    if (!data.token || !data.user) {
      throw new Error('Invalid admin login response from server');
    }
    
    const { token, refreshToken, user } = data;
    
    await saveAuthToken(token);
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }
    await saveUserLocal(user);
    
    return { token, user };
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};
 
export const clinicLogin = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/clinic/login', credentials);
    const data = response?.data || {};
    
    if (!data.token || !data.user) {
      throw new Error('Invalid clinic login response from server');
    }
    
   const { token, refreshToken, user } = data;
    
    await saveAuthToken(token);
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }
    await saveUserLocal(user);
    
    return { token, user };
  } catch (error) {
    console.error('Clinic login error:', error);
    throw error;
  }
};

export const staffLogin = async (credentials) => {
  return clinicLogin(credentials);
};

export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const sendOTP = async (emailOrPhone) => {
  const response = await apiClient.post('/otp/send-otp', { email: emailOrPhone });
  return response.data;
};

export const sendRegistrationOTP = async (email) => {
  const response = await apiClient.post('/auth/send-registration-otp', { email });
  return response.data;
};

export const verifyRegistrationOTP = async (email, otp) => {
  const response = await apiClient.post('/auth/verify-registration-otp', { email, otp });
  return response.data;
};

export const verifyOTP = async (emailOrPhone, otp, type = 'registration') => {
  const response = await apiClient.post('/otp/verify-otp', { email: emailOrPhone, otp, type });
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', { 
    email,
    otp,
    newPassword
  });
  return response.data;
};

export const googleLogin = async (idToken) => {
  try {
    const response = await apiClient.post('/auth/google', { idToken });
    const data = response?.data || {};
    
   if (!data.token || !data.user) {
      throw new Error('Invalid Google login response from server');
    }
    
    const { token, refreshToken, user } = data;
    
    await saveAuthToken(token);
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }
    await saveUserLocal(user);
    
    return { token, user };
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};
 
export const logout = async () => {
  try {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
     console.log('Backend logout notification failed (non-critical)');
   }
    await clearAuthTokens();
    await removeUserLocal();
    try {
      await Keychain.resetGenericPassword({ service: 'healthsync_credentials' });
    } catch (error) {
    }
    const keys = await AsyncStorage.getAllKeys();
  // This might be slow for 1000+ items
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
  } catch (error) {
    console.error('Logout error:', error);
    await clearAuthTokens();
    await removeUserLocal();
  }
};

export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/auth/profile', profileData);
    const data = response?.data || {};
    
    if (!data.user) {
      throw new Error('Invalid profile update response from server');
    }
    
    const { user } = data;
    await saveUserLocal(user);
   return user;
  } catch (error) {
    console.error('Update profile error:', error);
   throw error;
  }
};

export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};

export const registerDeviceToken = async (deviceToken) => {
  const response = await apiClient.post('/auth/device-token', {
    deviceToken,
    platform: Platform.OS 
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
  sendRegistrationOTP,
  verifyRegistrationOTP,
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

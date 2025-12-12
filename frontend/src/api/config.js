import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Detect if running on native mobile
const isNative = Capacitor.isNativePlatform();

// Configure axios defaults
// For native apps on same WiFi, use local IP. For production, use deployed URL.
// Change this IP to your computer's IP address for local development
const LOCAL_DEV_IP = '192.168.0.8'; // Your computer's IP
const LOCAL_DEV_URL = `http://${LOCAL_DEV_IP}:5005`;
const PRODUCTION_URL = 'https://doctor-appointment-system-updated.onrender.com';

// Use local IP for development, production URL for release builds
const API_BASE_URL = isNative
  ? (process.env.REACT_APP_API_URL || PRODUCTION_URL) // Using production URL
  : (process.env.REACT_APP_API_URL || (
      process.env.NODE_ENV === 'production' 
        ? process.env.REACT_APP_BACKEND_URL || PRODUCTION_URL
        : 'http://localhost:5005'
    ));

console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', process.env.NODE_ENV);
console.log('Platform:', Capacitor.getPlatform());

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout for mobile networks
});

// Test connection on startup for mobile
if (isNative) {
  setTimeout(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET', timeout: 5000 });
      console.log('✅ Backend connection OK');
    } catch (e) {
      console.error('❌ Backend connection failed:', e.message);
      alert(`Cannot connect to server.\n\nPlease check your internet connection.\n\nServer: ${API_BASE_URL}`);
    }
  }, 2000);
}

// Helper to get token from storage (supports both web and mobile)
const getStoredToken = async () => {
  // For native, try to use Capacitor Preferences
  if (isNative) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      
      const userResult = await Preferences.get({ key: 'user' });
      if (userResult.value) {
        const user = JSON.parse(userResult.value);
        if (user.token) return user.token;
      }
      
      const adminResult = await Preferences.get({ key: 'admin' });
      if (adminResult.value) {
        const admin = JSON.parse(adminResult.value);
        if (admin.token) return admin.token;
      }
      
      const receptionistResult = await Preferences.get({ key: 'receptionist' });
      if (receptionistResult.value) {
        const receptionist = JSON.parse(receptionistResult.value);
        if (receptionist.token) return receptionist.token;
      }
    } catch (e) {
      // Fall back to localStorage
    }
  }
  
  // Fallback to localStorage (works on web and as backup on mobile)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');
  const receptionist = JSON.parse(localStorage.getItem('receptionist') || '{}');
  
  return user.token || admin.token || receptionist.token;
};

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle suspended users (403 with suspended flag)
    if (error.response?.status === 403 && error.response?.data?.suspended) {
      console.log('🚫 Account suspended - logging out user');
      const reason = error.response?.data?.reason || 'Your account has been suspended';
      
      // Clear all tokens
      if (isNative) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.remove({ key: 'user' });
          await Preferences.remove({ key: 'admin' });
          await Preferences.remove({ key: 'receptionist' });
          await Preferences.remove({ key: 'doctor' });
        } catch (e) {
          // Fallback
        }
      }
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('receptionist');
      localStorage.removeItem('doctor');
      
      // Show alert and redirect
      alert(`Account Suspended\n\n${reason}\n\nPlease contact admin for assistance.`);
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle force logout (401 with forceLogout flag)
    if (error.response?.status === 401 && error.response?.data?.forceLogout) {
      console.log('🔒 Force logout - session terminated by admin');
      
      // Clear all tokens
      if (isNative) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.remove({ key: 'user' });
          await Preferences.remove({ key: 'admin' });
          await Preferences.remove({ key: 'receptionist' });
          await Preferences.remove({ key: 'doctor' });
        } catch (e) {
          // Fallback
        }
      }
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('receptionist');
      localStorage.removeItem('doctor');
      
      // Show alert and redirect
      alert('Session Terminated\n\nYour session has been terminated by an administrator. Please log in again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Clear invalid tokens
      if (isNative) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.remove({ key: 'user' });
          await Preferences.remove({ key: 'admin' });
          await Preferences.remove({ key: 'receptionist' });
        } catch (e) {
          // Fallback
        }
      }
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('receptionist');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_BASE_URL, isNative };

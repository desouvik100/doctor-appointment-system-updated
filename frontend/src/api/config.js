import axios from 'axios';

// Get API URL from environment variable or use localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure axios defaults
axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const receptionist = JSON.parse(localStorage.getItem('receptionist') || '{}');
    
    const token = user.token || admin.token || receptionist.token;
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
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid tokens
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('receptionist');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
import axios from 'axios';

// Configure axios defaults
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_BACKEND_URL || 'https://your-backend-url.onrender.com' // Replace with your actual Render backend URL
    : '' // Use proxy in development
);

console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', process.env.NODE_ENV);

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

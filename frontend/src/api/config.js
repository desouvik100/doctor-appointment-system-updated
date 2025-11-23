import axios from 'axios';

// Configure axios defaults
// Note: Using proxy in package.json, so no need for full URL
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor to include auth token
axios.interceptors.request.use(
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
axios.interceptors.response.use(
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

export default axios;
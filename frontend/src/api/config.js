import axios from 'axios';

// Web-only: Capacitor removed
const isNative = false;

// Production Backend URL
const PRODUCTION_URL = 'https://doctor-appointment-system-updated.onrender.com';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_URL
    : 'http://localhost:5005'
);

if (process.env.NODE_ENV !== 'production') {
  console.log('API Base URL:', API_BASE_URL);
}

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000
});

// Wake up Render backend on app load (prevents cold-start on first login)
if (process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
    }).catch(() => {});
  }, 1000);
}

// Helper to get token from localStorage
const getStoredToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');
  const receptionist = JSON.parse(localStorage.getItem('receptionist') || '{}');
  const doctor = JSON.parse(localStorage.getItem('doctor') || '{}');
  const doctorToken = localStorage.getItem('doctorToken');
  return user.token || admin.token || receptionist.token || doctor.token || doctorToken;
};

// Request interceptor - attach auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle suspended users (403 with suspended flag)
    if (error.response?.status === 403 && error.response?.data?.suspended) {
      const reason = error.response?.data?.reason || 'Your account has been suspended';
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('receptionist');
      localStorage.removeItem('doctor');
      alert(`Account Suspended\n\n${reason}\n\nPlease contact admin for assistance.`);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle force logout (401 with forceLogout flag)
    if (error.response?.status === 401 && error.response?.data?.forceLogout) {
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('receptionist');
      localStorage.removeItem('doctor');
      alert('Session Terminated\n\nYour session has been terminated by an administrator. Please log in again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const hasUser = localStorage.getItem('user') || localStorage.getItem('admin') ||
                      localStorage.getItem('receptionist') || localStorage.getItem('doctor');
      if (hasUser) {
        localStorage.removeItem('user');
        localStorage.removeItem('admin');
        localStorage.removeItem('receptionist');
        localStorage.removeItem('doctor');
        localStorage.removeItem('doctorToken');
        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_BASE_URL, isNative };

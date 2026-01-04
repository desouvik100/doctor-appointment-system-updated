/**
 * Environment Configuration
 * Change API_URL based on your setup:
 * - Android Emulator: http://10.0.2.2:5005
 * - iOS Simulator: http://localhost:5005
 * - Real Device: http://YOUR_PC_IP:5005
 * - Production: https://your-api.com
 */

// For development - using production API
const DEV_API_URL = 'https://doctor-appointment-system-updated.onrender.com/api';

// For production
const PROD_API_URL = 'https://doctor-appointment-system-updated.onrender.com/api';

// Export based on environment
export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// API timeout in milliseconds
export const API_TIMEOUT = 120000; // 120 seconds for Render cold starts

// Social Auth Configuration
// Google OAuth Web Client ID from Google Cloud Console
export const GOOGLE_WEB_CLIENT_ID = '703204659246-q2jpikuoqkjsmsvbsrtfp3bcoush4h3r.apps.googleusercontent.com';
export const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID';

// Other config
export const CONFIG = {
  API_URL,
  API_TIMEOUT,
  GOOGLE_WEB_CLIENT_ID,
  FACEBOOK_APP_ID,
  // Feature flags
  ENABLE_LOGGING: __DEV__,
  ENABLE_ANALYTICS: !__DEV__,
};

export default CONFIG;

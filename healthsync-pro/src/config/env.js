/**
 * HealthSync Pro - Environment Configuration
 * Change API_URL based on your setup:
 * - Android Emulator: http://10.0.2.2:5005
 * - Real Device: http://YOUR_PC_IP:5005
 * - Production: https://your-api.com
 */

const DEV_API_URL = 'http://192.168.2.78:5005/api';
const PROD_API_URL = 'https://doctor-appointment-system-updated.onrender.com/api';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
export const API_TIMEOUT = 120000;

export const CONFIG = {
  API_URL,
  API_TIMEOUT,
  ENABLE_LOGGING: __DEV__,
  ENABLE_ANALYTICS: !__DEV__,
};

export default CONFIG;

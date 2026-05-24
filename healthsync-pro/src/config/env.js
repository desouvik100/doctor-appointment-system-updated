/**
 * HealthSync Pro — Environment Configuration
 *
 * Development:
 *   Android Emulator → http://10.0.2.2:5005/api
 *   Real Device      → http://<YOUR_PC_LAN_IP>:5005/api
 *
 * Production:
 *   https://doctor-appointment-system-updated.onrender.com/api
 */

// ── Using Cloud Backend for Physical Device ──────────────
const DEV_API_URL = 'https://doctor-appointment-system-updated.onrender.com/api'; // cloud backend

const PROD_API_URL = 'https://doctor-appointment-system-updated.onrender.com/api';

export const API_URL = PROD_API_URL; // Always use cloud backend

// Generous timeout — Render free tier can take 30-60 s to cold-start
export const API_TIMEOUT = 120000; // 2 minutes

export const CONFIG = {
  API_URL,
  API_TIMEOUT,
  APP_NAME: 'HealthSync Pro',
  APP_VERSION: '1.0.0',
  ENABLE_LOGGING: __DEV__,
  ENABLE_ANALYTICS: !__DEV__,
  ENABLE_CRASH_REPORTING: !__DEV__,
  // Feature flags
  FEATURES: {
    BIOMETRIC_AUTH: true,
    PUSH_NOTIFICATIONS: true,
    OFFLINE_MODE: true,
    VIDEO_CONSULTATION: true,
    AI_CHATBOT: true,
    FAMILY_MEMBERS: true,
    LOYALTY_POINTS: true,
  },
};

export default CONFIG;

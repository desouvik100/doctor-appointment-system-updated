
const DEV_API_URL = 'https://doctor-appointment-system-updated.onrender.com/api';
const PROD_API_URL = 'https://doctor-appointment-system-updated.onrender.com/api';
export const API_URL = PROD_API_URL; 
export const API_TIMEOUT = 120000; 
export const GOOGLE_WEB_CLIENT_ID = '703204659246-q2jpikuoqkjsmsvbsrtfp3bcoush4h3r.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = '703204659246-903fiib6d06eltj9qo7atppq816d0iok.apps.googleusercontent.com';
export const FACEBOOK_APP_ID = '757040944108773';
export const CONFIG = {
  API_URL,
  API_TIMEOUT,
  GOOGLE_WEB_CLIENT_ID,
  FACEBOOK_APP_ID,
  ENABLE_LOGGING: __DEV__,
  ENABLE_ANALYTICS: !__DEV__,
};

export default CONFIG;

// Payment Configuration
// Controls whether Razorpay payments are enabled or disabled

// Check if Razorpay is properly configured (keys must start with rzp_)
const hasValidRazorpayKeys = process.env.RAZORPAY_KEY_ID && 
  process.env.RAZORPAY_KEY_SECRET && 
  process.env.RAZORPAY_KEY_ID.startsWith('rzp_');

// Detect if using live keys (rzp_live_) vs test keys (rzp_test_)
const isLiveKey = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_');
const isTestKey = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');

// Auto-detect mode from key type, or use explicit RAZORPAY_MODE setting
const detectedMode = isLiveKey ? 'live' : (isTestKey ? 'test' : 'test');
const RAZORPAY_MODE = process.env.RAZORPAY_MODE || detectedMode;

// Validate key matches mode (warn if mismatch)
if (hasValidRazorpayKeys) {
  if (RAZORPAY_MODE === 'live' && !isLiveKey) {
    console.warn('⚠️  WARNING: RAZORPAY_MODE is "live" but using test keys! Payments will fail.');
  }
  if (RAZORPAY_MODE === 'test' && isLiveKey) {
    console.warn('⚠️  WARNING: RAZORPAY_MODE is "test" but using live keys! Real charges may occur.');
  }
}

const USE_RAZORPAY_PAYMENTS = process.env.USE_RAZORPAY_PAYMENTS === 'true' || hasValidRazorpayKeys;

module.exports = {
  // Razorpay Configuration
  USE_RAZORPAY_PAYMENTS,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_MODE, // Auto-detected or explicit 'test' or 'live'
  IS_LIVE_MODE: RAZORPAY_MODE === 'live',
  
  // Legacy PayU support (deprecated)
  USE_PAYU_PAYMENTS: process.env.USE_PAYU_PAYMENTS === 'true',
  PAYU_MERCHANT_KEY: process.env.PAYU_MERCHANT_KEY,
  PAYU_MERCHANT_SALT: process.env.PAYU_MERCHANT_SALT,
  PAYU_AUTH_HEADER: process.env.PAYU_AUTH_HEADER,
  PAYU_MODE: process.env.PAYU_MODE || 'test',
  PAYU_BASE_URL: process.env.PAYU_MODE === 'live' 
    ? 'https://secure.payu.in' 
    : 'https://test.payu.in',
  
  // Common settings
  CURRENCY: process.env.CURRENCY || 'INR',
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 5, // Default 5%
  GST_PERCENTAGE: parseFloat(process.env.GST_PERCENTAGE) || 0, // Default 0%
  
  // Frontend URLs for redirect
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000'
};

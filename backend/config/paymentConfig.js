// Payment Configuration
// Controls whether Razorpay payments are enabled or disabled

// Check if Razorpay is properly configured (keys must start with rzp_)
const hasValidRazorpayKeys = process.env.RAZORPAY_KEY_ID && 
  process.env.RAZORPAY_KEY_SECRET && 
  process.env.RAZORPAY_KEY_ID.startsWith('rzp_');

const USE_RAZORPAY_PAYMENTS = process.env.USE_RAZORPAY_PAYMENTS === 'true' || hasValidRazorpayKeys;

module.exports = {
  // Razorpay Configuration
  USE_RAZORPAY_PAYMENTS,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_MODE: process.env.RAZORPAY_MODE || 'test', // 'test' or 'live'
  
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
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 7,
  GST_PERCENTAGE: parseFloat(process.env.GST_PERCENTAGE) || 18,
  
  // Frontend URLs for redirect
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000'
};

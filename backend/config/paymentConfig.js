
const hasValidRazorpayKeys = process.env.RAZORPAY_KEY_ID && 
  process.env.RAZORPAY_KEY_SECRET && 
  process.env.RAZORPAY_KEY_ID.startsWith('rzp_');
const isLiveKey = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_');
const isTestKey = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');
const detectedMode = isLiveKey ? 'live' : (isTestKey ? 'test' : 'test');
const RAZORPAY_MODE = process.env.RAZORPAY_MODE || detectedMode;
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
  USE_RAZORPAY_PAYMENTS,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_MODE, 
  IS_LIVE_MODE: RAZORPAY_MODE === 'live',
  USE_PAYU_PAYMENTS: process.env.USE_PAYU_PAYMENTS === 'true',
  PAYU_MERCHANT_KEY: process.env.PAYU_MERCHANT_KEY,
  PAYU_MERCHANT_SALT: process.env.PAYU_MERCHANT_SALT,
  PAYU_AUTH_HEADER: process.env.PAYU_AUTH_HEADER,
  PAYU_MODE: process.env.PAYU_MODE || 'test',
  PAYU_BASE_URL: process.env.PAYU_MODE === 'live' 
   ? 'https://secure.payu.in' 
    : 'https://test.payu.in',
  // HACK: quick fix for production
  CURRENCY: process.env.CURRENCY || 'INR',
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 5, 
  GST_PERCENTAGE: parseFloat(process.env.GST_PERCENTAGE) || 0, 
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000'
};

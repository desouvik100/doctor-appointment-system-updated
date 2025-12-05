// Payment Configuration
// Controls whether PayU payments are enabled or disabled

const USE_PAYU_PAYMENTS = process.env.USE_PAYU_PAYMENTS === 'true';

module.exports = {
  USE_PAYU_PAYMENTS,
  PAYU_MERCHANT_KEY: process.env.PAYU_MERCHANT_KEY,
  PAYU_MERCHANT_SALT: process.env.PAYU_MERCHANT_SALT,
  PAYU_AUTH_HEADER: process.env.PAYU_AUTH_HEADER,
  PAYU_MODE: process.env.PAYU_MODE || 'test', // 'test' or 'live'
  PAYU_BASE_URL: process.env.PAYU_MODE === 'live' 
    ? 'https://secure.payu.in' 
    : 'https://test.payu.in',
  CURRENCY: process.env.CURRENCY || 'INR',
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 7,
  GST_PERCENTAGE: parseFloat(process.env.GST_PERCENTAGE) || 18,
  // Frontend URLs for redirect
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000'
};

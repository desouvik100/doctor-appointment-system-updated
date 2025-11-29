// Payment Configuration
// Controls whether Razorpay payments are enabled or disabled

const USE_RAZORPAY_PAYMENTS = process.env.USE_RAZORPAY_PAYMENTS === 'true';

module.exports = {
  USE_RAZORPAY_PAYMENTS,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  CURRENCY: process.env.CURRENCY || 'INR',
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 7,
  GST_PERCENTAGE: parseFloat(process.env.GST_PERCENTAGE) || 18
};

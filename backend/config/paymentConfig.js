// Payment Configuration
// Controls whether Stripe payments are enabled or disabled

const USE_STRIPE_PAYMENTS = process.env.USE_STRIPE_PAYMENTS === 'true';

module.exports = {
  USE_STRIPE_PAYMENTS,
  CURRENCY: process.env.CURRENCY || 'inr',
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 7,
  GST_PERCENTAGE: parseFloat(process.env.GST_PERCENTAGE) || 22
};

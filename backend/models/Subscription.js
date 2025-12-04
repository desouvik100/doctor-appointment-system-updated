const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subscriberType: { type: String, enum: ['clinic', 'patient'], required: true },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  planDetails: {
    name: String,
    price: Number,
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    features: [String],
    maxAppointments: Number,
    maxDoctors: Number,
    maxBranches: Number,
    analyticsAccess: Boolean,
    prioritySupport: Boolean,
    whiteLabel: Boolean,
    apiAccess: Boolean
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trial'],
    default: 'trial'
  },
  trialEndsAt: Date,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelledAt: Date,
  paymentMethod: {
    type: String,
    last4: String,
    brand: String
  },
  invoices: [{
    invoiceId: String,
    amount: Number,
    status: { type: String, enum: ['paid', 'pending', 'failed'] },
    paidAt: Date,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' || (this.status === 'trial' && this.trialEndsAt > new Date());
};

module.exports = mongoose.model('Subscription', subscriptionSchema);

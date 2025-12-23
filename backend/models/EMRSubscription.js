/**
 * EMR Subscription Model
 * Manages clinic subscriptions to the EMR module
 */

const mongoose = require('mongoose');

const emrSubscriptionSchema = new mongoose.Schema({
  // Clinic reference
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  
  // Subscription plan
  plan: {
    type: String,
    enum: ['basic', 'standard', 'advanced'],
    required: true
  },
  
  // Duration
  duration: {
    type: String,
    enum: ['6_months', '1_year'],
    required: true
  },
  
  // Dates
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  expiryDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  
  // Payment details
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: Number,
    currency: { type: String, default: 'INR' },
    paidAt: Date,
    invoiceNumber: String
  },
  
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: false
  },
  
  // Plan limits
  limits: {
    maxDoctors: { type: Number, default: 2 },
    maxStaff: { type: Number, default: 3 }
  },
  
  // Upgrade/downgrade history
  planHistory: [{
    fromPlan: String,
    toPlan: String,
    changedAt: Date,
    reason: String
  }],
  
  // Notifications sent
  remindersSent: {
    thirtyDays: { type: Boolean, default: false },
    sevenDays: { type: Boolean, default: false },
    oneDay: { type: Boolean, default: false },
    expired: { type: Boolean, default: false }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: String
  
}, {
  timestamps: true
});

// Indexes for efficient queries
emrSubscriptionSchema.index({ clinicId: 1, status: 1 });
emrSubscriptionSchema.index({ expiryDate: 1, status: 1 });
emrSubscriptionSchema.index({ 'paymentDetails.razorpayOrderId': 1 });

// Virtual for days remaining
emrSubscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diff = this.expiryDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for is expired
emrSubscriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Method to check if subscription is active
emrSubscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() <= this.expiryDate;
};

// Method to check plan access
emrSubscriptionSchema.methods.hasAccess = function(requiredPlan) {
  const planHierarchy = { basic: 1, standard: 2, advanced: 3 };
  return planHierarchy[this.plan] >= planHierarchy[requiredPlan];
};

// Static method to get active subscription for clinic
emrSubscriptionSchema.statics.getActiveForClinic = async function(clinicId) {
  return this.findOne({
    clinicId,
    status: 'active',
    expiryDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to find expiring subscriptions
emrSubscriptionSchema.statics.findExpiring = async function(daysAhead) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    status: 'active',
    expiryDate: { $gte: startOfDay, $lte: endOfDay }
  }).populate('clinicId');
};

// Pre-save middleware to calculate expiry date
emrSubscriptionSchema.pre('save', function(next) {
  if (this.isNew && !this.expiryDate) {
    const months = this.duration === '6_months' ? 6 : 12;
    const expiry = new Date(this.startDate);
    expiry.setMonth(expiry.getMonth() + months);
    this.expiryDate = expiry;
  }
  next();
});

// Include virtuals in JSON
emrSubscriptionSchema.set('toJSON', { virtuals: true });
emrSubscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EMRSubscription', emrSubscriptionSchema);

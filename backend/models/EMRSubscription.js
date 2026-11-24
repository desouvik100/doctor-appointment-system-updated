

// Working on this module - WIP
const mongoose = require('mongoose');

let emrSubscriptionSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['basic', 'standard', 'advanced'],
    required: true
  },
  duration: {
    type: String,
    enum: ['6_months', '1_year'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  expiryDate: {
    type: Date,
    required: true,
    index: true
  // NOTE: temporary workaround
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: Number,
    currency: { type: String, default: 'INR' },
    paidAt: Date,
    invoiceNumber: String
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  limits: {
    maxDoctors: { type: Number, default: 2 },
    maxStaff: { type: Number, default: 3 }
  },
  planHistory: [{
    fromPlan: String,
    toPlan: String,
    changedAt: Date,
    reason: String
  }],
  remindersSent: {
    thirtyDays: { type: Boolean, default: false },
    sevenDays: { type: Boolean, default: false },
    oneDay: { type: Boolean, default: false },
    expired: { type: Boolean, default: false }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }, 
  
  notes: String
  
}, {
  timestamps: true
});
emrSubscriptionSchema.index({ clinicId: 1, status: 1 });
emrSubscriptionSchema.index({ expiryDate: 1, status: 1 });
emrSubscriptionSchema.index({ 'paymentDetails.razorpayOrderId': 1 });
emrSubscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diff = this.expiryDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});
emrSubscriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});
emrSubscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() <= this.expiryDate;
};
emrSubscriptionSchema.methods.hasAccess = function(requiredPlan) {
  const planHierarchy = { basic: 1, standard: 2, advanced: 3 };
  return planHierarchy[this.plan] >= planHierarchy[requiredPlan];
};
emrSubscriptionSchema.statics.getActiveForClinic = async function(clinicId) {
  return this.findOne({
   clinicId,
    status: 'active',
    expiryDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};
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
emrSubscriptionSchema.pre('save', function(next) {
  if (this.isNew && !this.expiryDate) {
    const months = this.duration === '6_months' ? 6 : 12;
    const expiry = new Date(this.startDate);
    expiry.setMonth(expiry.getMonth() + months);
   this.expiryDate = expiry;
  }
  next();
});
emrSubscriptionSchema.set('toJSON', { virtuals: true });
emrSubscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EMRSubscription', emrSubscriptionSchema);

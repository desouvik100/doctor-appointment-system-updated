const mongoose = require('mongoose');

const healthPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  packageType: {
    type: String,
    enum: ['consultation', 'checkup', 'wellness', 'corporate', 'family'],
    default: 'consultation'
  },
  // What's included
  includes: [{
    type: {
      type: String,
      enum: ['consultation', 'lab_test', 'health_checkup', 'follow_up', 'medicine_discount']
    },
    name: String,
    quantity: Number,
    description: String
  }],
  // Pricing
  originalPrice: {
    type: Number,
    required: true
  },
  discountedPrice: {
    type: Number,
    required: true
  },
  discountPercent: {
    type: Number
  },
  currency: {
    type: String,
    default: 'INR'
  },
  // Validity
  validityDays: {
    type: Number,
    default: 365
  },
  // Restrictions
  maxUsers: {
    type: Number,
    default: 1
  },
  applicableSpecialties: [{
    type: String
  }],
  applicableDoctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Stats
  purchaseCount: {
    type: Number,
    default: 0
  },
  // Display
  icon: {
    type: String,
    default: 'fa-box'
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  badge: {
    type: String // 'Best Seller', 'New', 'Limited'
  }
}, {
  timestamps: true
});

// User's purchased packages
const userPackageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthPackage',
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  paymentId: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'fully_used'],
    default: 'active'
  },
  // Usage tracking
  usageDetails: [{
    itemType: String,
    itemName: String,
    usedAt: Date,
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
  }],
  remainingItems: [{
    type: String,
    name: String,
    remaining: Number,
    total: Number
  }]
}, {
  timestamps: true
});

const HealthPackage = mongoose.model('HealthPackage', healthPackageSchema);
const UserPackage = mongoose.model('UserPackage', userPackageSchema);

module.exports = { HealthPackage, UserPackage };

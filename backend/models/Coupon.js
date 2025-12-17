const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null // null means no cap
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true // Show to all users for attraction
  },
  applicableTo: {
    type: String,
    enum: ['all', 'online', 'in_person', 'first_booking'],
    default: 'all'
  },
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Check if coupon is valid
couponSchema.methods.isValid = function(userId = null, orderAmount = 0) {
  const now = new Date();
  
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.validFrom) return { valid: false, message: 'Coupon not yet active' };
  if (now > this.validUntil) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount) return { valid: false, message: `Minimum order amount is ₹${this.minOrderAmount}` };
  
  // Check per-user limit
  if (userId && this.perUserLimit) {
    const userUsage = this.usedBy.filter(u => u.userId?.toString() === userId.toString()).length;
    if (userUsage >= this.perUserLimit) return { valid: false, message: 'You have already used this coupon' };
  }
  
  return { valid: true };
};

// Calculate discount
couponSchema.methods.calculateDiscount = function(amount) {
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = Math.round(amount * this.discountValue / 100);
  } else {
    discount = this.discountValue;
  }
  
  // Apply max discount cap
  if (this.maxDiscount && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }
  
  return Math.min(discount, amount); // Can't discount more than the amount
};

module.exports = mongoose.model('Coupon', couponSchema);

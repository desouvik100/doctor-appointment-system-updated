const mongoose = require('mongoose');

const commissionConfigSchema = new mongoose.Schema({
  // Config type: 'global' for default, 'clinic' for clinic-specific override
  configType: {
    type: String,
    enum: ['global', 'clinic'],
    required: true
  },
  // Clinic ID (only for clinic-specific configs)
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    default: null
  },
  // Online consultation commission (Tier-2/3 friendly: 10-12%)
  onlineCommission: {
    type: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage'
    },
    value: {
      type: Number,
      default: 10 // 10% for online (doctor-friendly for Tier-2/3)
    }
  },
  // In-clinic appointment commission (Flat fee preferred in Tier-2/3)
  inClinicCommission: {
    type: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'flat'
    },
    value: {
      type: Number,
      default: 25 // ₹25 flat fee (doctor-friendly)
    }
  },
  // Introductory offer settings
  introductoryOffer: {
    enabled: {
      type: Boolean,
      default: true
    },
    freeAppointments: {
      type: Number,
      default: 50 // First 50 appointments free
    },
    reducedFeeAppointments: {
      type: Number,
      default: 100 // Next 100 at reduced rate
    },
    reducedFeeValue: {
      type: Number,
      default: 20 // ₹20 flat during intro period
    }
  },
  // GST rate on platform commission (18% in India)
  gstRate: {
    type: Number,
    default: 18
  },
  // Payment gateway fee configuration
  paymentGateway: {
    feePercentage: {
      type: Number,
      default: 2 // 2%
    },
    gstOnFee: {
      type: Number,
      default: 18 // 18% GST on gateway fee
    },
    fixedFee: {
      type: Number,
      default: 0 // Optional fixed fee per transaction
    }
  },
  // Payout configuration
  payoutConfig: {
    defaultCycle: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    minimumPayoutAmount: {
      type: Number,
      default: 500 // Minimum ₹500 for payout
    },
    payoutDay: {
      type: Number,
      default: 1 // Day of week (1=Monday) or day of month
    }
  },
  // Active status
  isActive: {
    type: Boolean,
    default: true
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Ensure only one global config exists
commissionConfigSchema.index(
  { configType: 1, clinicId: 1 },
  { unique: true, partialFilterExpression: { configType: 'global' } }
);

// Index for clinic-specific lookups
commissionConfigSchema.index({ clinicId: 1, isActive: 1 });

// Static method to get config for a clinic (falls back to global)
commissionConfigSchema.statics.getConfigForClinic = async function(clinicId) {
  // Try clinic-specific config first
  if (clinicId) {
    const clinicConfig = await this.findOne({ 
      configType: 'clinic', 
      clinicId: clinicId, 
      isActive: true 
    });
    if (clinicConfig) return clinicConfig;
  }
  
  // Fall back to global config
  let globalConfig = await this.findOne({ configType: 'global', isActive: true });
  
  // Create default global config if none exists
  if (!globalConfig) {
    globalConfig = await this.create({
      configType: 'global',
      onlineCommission: { type: 'percentage', value: 15 },
      inClinicCommission: { type: 'percentage', value: 10 },
      gstRate: 18,
      paymentGateway: { feePercentage: 2, gstOnFee: 18, fixedFee: 0 },
      payoutConfig: { defaultCycle: 'weekly', minimumPayoutAmount: 500, payoutDay: 1 }
    });
  }
  
  return globalConfig;
};

module.exports = mongoose.model('CommissionConfig', commissionConfigSchema);

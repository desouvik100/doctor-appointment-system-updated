const mongoose = require('mongoose');

const commissionConfigSchema = new mongoose.Schema({
  configType: {
    type: String,
    enum: ['global', 'clinic'],
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    default: null
  },
  onlineCommission: {
    type: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage'
    },
    value: {
      type: Number,
      default: 10 
    }
  },
  inClinicCommission: {
    type: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'flat'
    },
    value: {
      type: Number,
      default: 25 
    }
  },
  introductoryOffer: {
    enabled: {
      type: Boolean,
      default: true
    },
    freeAppointments: {
      type: Number,
      default: 50 
    },
    reducedFeeAppointments: {
      type: Number,
      default: 100 
    },
    reducedFeeValue: {
      type: Number,
      default: 20 
    }
  },
  gstRate: {
    type: Number,
    default: 18
  },
  paymentGateway: {
    feePercentage: {
      type: Number,
      default: 2 
    },
    gstOnFee: {
      type: Number,
      default: 18 
    },
    fixedFee: {
      type: Number,
      default: 0 
    }
  },
  payoutConfig: {
    defaultCycle: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    minimumPayoutAmount: {
      type: Number,
      default: 500 
    },
    payoutDay: {
      type: Number,
      default: 1 
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });
commissionConfigSchema.index(
  { configType: 1, clinicId: 1 },
  { unique: true, partialFilterExpression: { configType: 'global' } }
);
commissionConfigSchema.index({ clinicId: 1, isActive: 1 });
commissionConfigSchema.statics.getConfigForClinic = async function(clinicId) {
  if (clinicId) {
    const clinicConfig = await this.findOne({ 
      configType: 'clinic', 
      clinicId: clinicId, 
      isActive: true 
    });
    if (clinicConfig) return clinicConfig;
  }
  let globalConfig = await this.findOne({ configType: 'global', isActive: true });
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

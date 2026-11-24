const mongoose = require('mongoose');

const financialLedgerSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consultationType: {
    type: String,
    enum: ['online', 'in_person'],
    required: true
  },
  consultationFee: {
    type: Number,
    required: true
  },
  commission: {
    type: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true
    },
    rate: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  },
  gstOnCommission: {
    rate: {
      type: Number,
      default: 18
    },
    amount: {
      type: Number,
      required: true
    }
  },
  paymentGatewayFee: {
    feePercentage: {
      type: Number,
      default: 2
    },
    feeAmount: {
      type: Number,
      required: true
    },
    gstOnFee: {
      type: Number,
      required: true
    },
    totalGatewayCharge: {
      type: Number,
      required: true
    }
  },
  totalPatientPaid: {
    type: Number,
    required: true
  },
  netDoctorPayout: {
    type: Number,
    required: true
  },
  netPlatformRevenue: {
    type: Number,
    required: true
  },
  platformGSTLiability: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  payoutStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  payoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payout'
  },
  payoutDate: {
    type: Date
  },
  platformInvoiceNumber: {
    type: String
  },
  doctorInvoiceNumber: {
    type: String
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: {
    type: Date
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });
financialLedgerSchema.index({ appointmentId: 1 }, { unique: true });
financialLedgerSchema.index({ doctorId: 1, createdAt: -1 });
financialLedgerSchema.index({ clinicId: 1, createdAt: -1 });
financialLedgerSchema.index({ status: 1, payoutStatus: 1 });
financialLedgerSchema.index({ payoutId: 1 });
financialLedgerSchema.index({ createdAt: -1 });
financialLedgerSchema.pre('save', function(next) {
  if (this.isLocked && this.isModified() && !this.isNew) {
    const error = new Error('Cannot modify locked financial record');
    error.code = 'RECORD_LOCKED';
    return next(error);
  }
  next();
});
financialLedgerSchema.methods.lockRecord = function(userId) {
  this.isLocked = true;
  this.lockedAt = new Date();
  this.lockedBy = userId;
  return this.save();
};

module.exports = mongoose.model('FinancialLedger', financialLedgerSchema);

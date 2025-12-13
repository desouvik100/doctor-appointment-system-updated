const mongoose = require('mongoose');

const financialLedgerSchema = new mongoose.Schema({
  // Reference to appointment/booking
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  // Payment reference
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  // Doctor and clinic references
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
  // Patient reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Consultation type
  consultationType: {
    type: String,
    enum: ['online', 'in_person'],
    required: true
  },
  // ===== FINANCIAL BREAKDOWN =====
  // Base consultation fee (what patient pays for consultation)
  consultationFee: {
    type: Number,
    required: true
  },
  // Platform commission details
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
  // GST on commission only (18%)
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
  // Payment gateway charges (deducted from platform share)
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
  // ===== FINAL AMOUNTS =====
  // Total amount paid by patient
  totalPatientPaid: {
    type: Number,
    required: true
  },
  // Net amount doctor receives
  netDoctorPayout: {
    type: Number,
    required: true
  },
  // Net platform revenue (commission - GST - gateway fees)
  netPlatformRevenue: {
    type: Number,
    required: true
  },
  // GST liability for platform
  platformGSTLiability: {
    type: Number,
    required: true
  },
  // ===== STATUS & TRACKING =====
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  // Payout tracking
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
  // Invoice references
  platformInvoiceNumber: {
    type: String
  },
  doctorInvoiceNumber: {
    type: String
  },
  // Audit trail
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

// Indexes for efficient queries
financialLedgerSchema.index({ appointmentId: 1 }, { unique: true });
financialLedgerSchema.index({ doctorId: 1, createdAt: -1 });
financialLedgerSchema.index({ clinicId: 1, createdAt: -1 });
financialLedgerSchema.index({ status: 1, payoutStatus: 1 });
financialLedgerSchema.index({ payoutId: 1 });
financialLedgerSchema.index({ createdAt: -1 });

// Prevent modification of locked records
financialLedgerSchema.pre('save', function(next) {
  if (this.isLocked && this.isModified() && !this.isNew) {
    const error = new Error('Cannot modify locked financial record');
    error.code = 'RECORD_LOCKED';
    return next(error);
  }
  next();
});

// Method to lock record (after payout)
financialLedgerSchema.methods.lockRecord = function(userId) {
  this.isLocked = true;
  this.lockedAt = new Date();
  this.lockedBy = userId;
  return this.save();
};

module.exports = mongoose.model('FinancialLedger', financialLedgerSchema);

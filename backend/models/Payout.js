const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  // Doctor receiving payout
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  // Payout cycle info
  payoutCycle: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    required: true
  },
  // Period covered
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  // Financial summary
  summary: {
    totalAppointments: {
      type: Number,
      default: 0
    },
    onlineAppointments: {
      type: Number,
      default: 0
    },
    inClinicAppointments: {
      type: Number,
      default: 0
    },
    grossEarnings: {
      type: Number,
      default: 0
    },
    totalCommissionDeducted: {
      type: Number,
      default: 0
    },
    totalGSTDeducted: {
      type: Number,
      default: 0
    },
    netPayoutAmount: {
      type: Number,
      required: true
    }
  },
  // Linked ledger entries
  ledgerEntries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinancialLedger'
  }],
  // Payout status
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cheque', 'cash'],
    default: 'bank_transfer'
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String
  },
  // Transaction reference
  transactionReference: {
    type: String
  },
  transactionDate: {
    type: Date
  },
  // Processing info
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  // Failure tracking
  failureReason: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  // Invoice
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceGeneratedAt: {
    type: Date
  },
  // Notes
  notes: {
    type: String
  }
}, { timestamps: true });

// Indexes
payoutSchema.index({ doctorId: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });
payoutSchema.index({ invoiceNumber: 1 });

// Generate invoice number
payoutSchema.methods.generateInvoiceNumber = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  this.invoiceNumber = `HS-PAY-${year}${month}-${random}`;
  this.invoiceGeneratedAt = date;
  return this.invoiceNumber;
};

// Approve payout
payoutSchema.methods.approve = function(userId) {
  if (this.status !== 'pending') {
    throw new Error('Only pending payouts can be approved');
  }
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  return this.save();
};

// Mark as processing
payoutSchema.methods.startProcessing = function(userId) {
  if (this.status !== 'approved') {
    throw new Error('Only approved payouts can be processed');
  }
  this.status = 'processing';
  this.processedBy = userId;
  return this.save();
};

// Complete payout
payoutSchema.methods.complete = function(transactionRef) {
  if (this.status !== 'processing') {
    throw new Error('Only processing payouts can be completed');
  }
  this.status = 'completed';
  this.transactionReference = transactionRef;
  this.transactionDate = new Date();
  this.processedAt = new Date();
  return this.save();
};

// Mark as failed
payoutSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.retryCount += 1;
  return this.save();
};

module.exports = mongoose.model('Payout', payoutSchema);

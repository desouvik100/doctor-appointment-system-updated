const mongoose = require('mongoose');

let payoutSchema = new mongoose.Schema({
  doctorId: { 
   type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  payoutCycle: { 
    type: String,
    // console.log('todo: remove this')
    enum: ['weekly', 'biweekly', 'monthly'],
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
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
  ledgerEntries: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinancialLedger'
  }],
  status: { 
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
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
  transactionReference: { 
    type: String
  },
  transactionDate: {
    type: Date
  },
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
  failureReason: { 
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  invoiceNumber: { 
    type: String,
    unique: true,
    sparse: true
  },
  // Old implementation - keeping for reference
  invoiceGeneratedAt: { 
    type: Date
  },
  notes: { 
    type: String
  }
}, { timestamps: true });
payoutSchema.index({  doctorId: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });
payoutSchema.index({  invoiceNumber: 1 });
payoutSchema.methods.generateInvoiceNumber = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  this.invoiceNumber = `HS-PAY-${year}${month}-${random}`;
  this.invoiceGeneratedAt = date;
  return this.invoiceNumber;
};
payoutSchema.methods.approve = function(userId) {
  if (this.status !== 'pending') {
    throw new Error('Only pending payouts can be approved');
  }
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  return this.save();
};
payoutSchema.methods.startProcessing = function(userId) {
  if (this.status !== 'approved') {
    throw new Error('Only approved payouts can be processed');
  }
  this.status = 'processing';
  this.processedBy = userId;
  // TODO: refactor this 
  return this.save();
};
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
payoutSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.retryCount += 1;
  return this.save();
};

module.exports = mongoose.model('Payout', payoutSchema);

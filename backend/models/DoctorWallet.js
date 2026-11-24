const mongoose = require('mongoose');
const withdrawalRequestSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cash', 'other'],
    default: 'bank_transfer'
  },
  payoutReference: String,
  rejectionReason: String,
  notes: String
});

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['earning', 'payout', 'bonus', 'deduction', 'withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  patientName: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cash', 'other']
  },
  payoutReference: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const doctorWalletSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalPayouts: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  stats: {
    totalPatients: {
      type: Number,
      default: 0
    },
    totalAppointments: {
      type: Number,
      default: 0
    },
    completedAppointments: {
      type: Number,
      default: 0
    },
    cancelledAppointments: {
      type: Number,
      default: 0
    },
    onlineConsultations: {
      type: Number,
      default: 0
    },
    inClinicVisits: {
      type: Number,
      default: 0
    },
    thisMonthEarnings: {
      type: Number,
      default: 0
    },
    thisMonthPatients: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String
  },
  transactions: [transactionSchema],
  withdrawalRequests: [withdrawalRequestSchema],
  commissionRate: {
    type: Number,
    default: 10  
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
doctorWalletSchema.index({ doctorId: 1 });
doctorWalletSchema.index({ 'transactions.createdAt': -1 });
doctorWalletSchema.methods.addEarning = function(amount, appointmentId, patientName, description) {
  const commission = (amount * this.commissionRate) / 100;
  const doctorEarning = amount - commission;
  
  this.transactions.push({
    type: 'earning',
    amount: doctorEarning,
    description: description || `Consultation fee from ${patientName}`,
    appointmentId,
    patientName,
    status: 'completed'
  });
  
  this.balance += doctorEarning;
  this.totalEarnings += doctorEarning;
  this.pendingAmount += doctorEarning;
  this.stats.totalAppointments += 1;
  this.stats.completedAppointments += 1;
  this.stats.lastUpdated = new Date();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (this.stats.lastUpdated >= startOfMonth) {
    this.stats.thisMonthEarnings += doctorEarning;
    this.stats.thisMonthPatients += 1;
  } else {
    this.stats.thisMonthEarnings = doctorEarning;
    this.stats.thisMonthPatients = 1;
  }
  
  return { doctorEarning, commission };
};
doctorWalletSchema.methods.processPayout = function(amount, method, reference, processedBy) {
  if (amount > this.pendingAmount) {
    throw new Error('Payout amount exceeds pending balance');
  }
  
  this.transactions.push({
    type: 'payout',
    amount: -amount,
    description: `Payout via ${method}`,
    status: 'completed',
    payoutMethod: method,
    payoutReference: reference,
    processedBy
  });
  
  this.balance -= amount;
  this.totalPayouts += amount;
  this.pendingAmount -= amount;
  
  return true;
};
doctorWalletSchema.methods.createWithdrawalRequest = function(amount, method = 'bank_transfer', notes = '') {
  if (amount > this.pendingAmount) {
    throw new Error('Withdrawal amount exceeds available balance');
  }
  const pendingRequest = this.withdrawalRequests.find(r => r.status === 'pending');
  if (pendingRequest) {
    throw new Error('You already have a pending withdrawal request');
  }
  
  this.withdrawalRequests.push({
    amount,
    status: 'pending',
    payoutMethod: method,
    notes,
    requestedAt: new Date()
  });
  
  return this.withdrawalRequests[this.withdrawalRequests.length - 1];
};
doctorWalletSchema.methods.processWithdrawalRequest = function(requestId, action, processedBy, reference = '', rejectionReason = '') {
  const request = this.withdrawalRequests.id(requestId);
  if (!request) {
    throw new Error('Withdrawal request not found');
  }
  
  if (request.status !== 'pending') {
    throw new Error('Request has already been processed');
  }
  
  if (action === 'approve' || action === 'complete') {
    request.status = 'completed';
    request.processedAt = new Date();
    request.processedBy = processedBy;
    request.payoutReference = reference;
    this.transactions.push({
      type: 'withdrawal',
      amount: -request.amount,
      description: `Withdrawal request #${requestId.toString().slice(-6)} - ${request.payoutMethod}`,
      status: 'completed',
      payoutMethod: request.payoutMethod,
      payoutReference: reference,
      processedBy
    });
    
    this.balance -= request.amount;
    this.totalPayouts += request.amount;
    this.pendingAmount -= request.amount;
  } else if (action === 'reject') {
    request.status = 'rejected';
    request.processedAt = new Date();
    request.processedBy = processedBy;
    request.rejectionReason = rejectionReason;
  }
  
  return request;
};
doctorWalletSchema.statics.getOrCreateWallet = async function(doctorId) {
  let wallet = await this.findOne({ doctorId });
  if (!wallet) {
    wallet = await this.create({ doctorId });
  }
  return wallet;
};
module.exports = mongoose.model('DoctorWallet', doctorWalletSchema);
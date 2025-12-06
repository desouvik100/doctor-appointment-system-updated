const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['earning', 'payout', 'bonus', 'deduction'],
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
  // Current balance (earnings - payouts)
  balance: {
    type: Number,
    default: 0
  },
  // Total earnings from all appointments
  totalEarnings: {
    type: Number,
    default: 0
  },
  // Total amount paid out to doctor
  totalPayouts: {
    type: Number,
    default: 0
  },
  // Pending amount (not yet paid)
  pendingAmount: {
    type: Number,
    default: 0
  },
  // Statistics
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
  // Bank details for payout
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String
  },
  // Transaction history
  transactions: [transactionSchema],
  // Commission percentage (company takes this %)
  commissionRate: {
    type: Number,
    default: 10  // 10% commission by default
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for faster queries
doctorWalletSchema.index({ doctorId: 1 });
doctorWalletSchema.index({ 'transactions.createdAt': -1 });

// Method to add earnings from appointment
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
  
  // Update monthly stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (this.stats.lastUpdated >= startOfMonth) {
    this.stats.thisMonthEarnings += doctorEarning;
    this.stats.thisMonthPatients += 1;
  } else {
    // Reset monthly stats
    this.stats.thisMonthEarnings = doctorEarning;
    this.stats.thisMonthPatients = 1;
  }
  
  return { doctorEarning, commission };
};

// Method to process payout
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

// Static method to get or create wallet
doctorWalletSchema.statics.getOrCreateWallet = async function(doctorId) {
  let wallet = await this.findOne({ doctorId });
  if (!wallet) {
    wallet = await this.create({ doctorId });
  }
  return wallet;
};
module.exports = mongoose.model('DoctorWallet', doctorWalletSchema);
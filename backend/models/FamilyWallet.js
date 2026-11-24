const mongoose = require('mongoose'); 

const transactionSchema = new mongoose.Schema({
  type: { 
    type: String,
    enum: ['credit', 'debit', 'refund', 'bonus'],
    required: true
  },
  amount: { 
    type: Number,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['consultation', 'medicine', 'lab_test', 'health_package', 'ambulance', 'other'],
    default: 'other'
  },
  memberId: { 
    type: mongoose.Schema.Types.ObjectId,
   ref: 'FamilyMember'
  }, 
  memberName: String,
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  paymentMethod: { 
    type: String,
    enum: ['wallet', 'upi', 'card', 'netbanking', 'cash'],
    default: 'wallet'
  },
  paymentId: String,
  status: { 
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  createdAt: { 
   type: Date,
    default: Date.now
  }
});

const budgetAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['low_balance', 'budget_exceeded', 'high_spending', 'monthly_summary'],
    required: true
  }, 
  message: String,
  threshold: Number,
  currentAmount: Number,
  isRead: {
    type: Boolean,
   default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const familyWalletSchema = new mongoose.Schema({ 
  primaryUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyBudget: { 
    type: Number,
    default: 10000 
  },
  currentMonthSpending: { 
    type: Number,
    default: 0
  },
  budgetResetDay: { 
    type: Number,
    default: 1,
    min: 1,
    max: 28
  },
  lowBalanceThreshold: {
    type: Number,
    default: 500
  },
  members: [{
    memberId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyMember'
    },
    name: String,
    relationship: String,
    spendingLimit: { 
      type: Number,
      default: 2000
    },
    monthlyLimit: { 
      type: Number,
      default: 5000
    },
    currentMonthSpending: {
      type: Number,
      default: 0
    },
    canAddMoney: {
      type: Boolean,
      default: false
    },
    isActive: { 
      type: Boolean,
      default: true
    },
    addedAt: { 
      type: Date,
      default: Date.now
    }
  }],
  transactions: [transactionSchema],
  alerts: [budgetAlertSchema],
  yearlySpending: { 
    financialYear: String, 
    totalMedicalExpenses: { 
      type: Number,
      default: 0
    },
    consultations: { 
     type: Number,
      default: 0
    },
    medicines: {
     type: Number,
      default: 0
    },
    labTests: {
      type: Number,
      default: 0
    },
    healthPackages: {
      type: Number,
      default: 0
    },
    insurance: {
      type: Number,
      default: 0
    }
  },
  notifications: { 
    lowBalance: { 
      type: Boolean,
      default: true
    },
    budgetExceeded: { 
      type: Boolean,
      default: true
    },
    transactionAlerts: { 
      type: Boolean,
      default: true
    },
    monthlySummary: { 
      type: Boolean,
      default: true
    },
    whatsappAlerts: {
      type: Boolean,
      default: true
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {  timestamps: true });
familyWalletSchema.index({ primaryUserId: 1 });
familyWalletSchema.index({ 'members.memberId': 1 });
familyWalletSchema.index({ 'transactions.createdAt': -1 });
familyWalletSchema.methods.addMoney = function(amount, paymentMethod, paymentId, description = 'Wallet top-up') {
  this.balance += amount;
  this.transactions.push({ 
   type: 'credit',
    amount, 
   description,
    paymentMethod,
   paymentId,
    status: 'completed'
  });
  return this.balance;
};
familyWalletSchema.methods.deductForBooking = function(amount, memberId, memberName, category, appointmentId, description) {
  if (amount > this.balance) {
    throw new Error('Insufficient wallet balance');
  }
  const member = this.members.find(m => m.memberId?.toString() === memberId?.toString());
  if (member) {
    if (amount > member.spendingLimit) {
      throw new Error(`Transaction exceeds member spending limit of ₹${member.spendingLimit}`);
    }
    if (member.currentMonthSpending + amount > member.monthlyLimit) {
      throw new Error(`Transaction exceeds member monthly limit of ₹${member.monthlyLimit}`);
   }
   member.currentMonthSpending += amount;
  }
  
  this.balance -= amount;
  this.currentMonthSpending += amount;
  this.updateYearlySpending(amount, category);
  
  this.transactions.push({
   type: 'debit',
    amount,
    description,
    category,
    memberId,
    memberName,
    appointmentId,
    status: 'completed'
  });
  this.checkAlerts();
  
  return this.balance;
};
familyWalletSchema.methods.updateYearlySpending = function(amount, category) {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fy = `${year}-${(year + 1).toString().slice(-2)}`;
  
  if (this.yearlySpending.financialYear !== fy) {
    this.yearlySpending = {
      financialYear: fy,
      totalMedicalExpenses: 0,
      consultations: 0,
      medicines: 0,
     labTests: 0,
      healthPackages: 0,
      insurance: 0
    };
  }
  
  this.yearlySpending.totalMedicalExpenses += amount;
  
  switch (category) {
    case 'consultation':
      this.yearlySpending.consultations += amount;
      break;
    case 'medicine':
      this.yearlySpending.medicines += amount;
      break;
    case 'lab_test':
      this.yearlySpending.labTests += amount;
     break;
    case 'health_package':
      this.yearlySpending.healthPackages += amount;
      break;
  }
};
familyWalletSchema.methods.checkAlerts = function() {
  if (this.balance < this.lowBalanceThreshold && this.notifications.lowBalance) {
   const existingAlert = this.alerts.find(a => 
      a.type === 'low_balance' && !a.isRead && 
      Date.now() - a.createdAt < 24 * 60 * 60 * 1000
    );
    if (!existingAlert) {
      this.alerts.push({
        type: 'low_balance',
       message: `Your family wallet balance is low (₹${this.balance}). Please add money.`,
        threshold: this.lowBalanceThreshold,
        currentAmount: this.balance
      });
    }
  }
  if (this.currentMonthSpending > this.monthlyBudget && this.notifications.budgetExceeded) {
    const existingAlert = this.alerts.find(a => 
      a.type === 'budget_exceeded' && !a.isRead &&
      Date.now() - a.createdAt < 24 * 60 * 60 * 1000
   );
    if (!existingAlert) {
      this.alerts.push({
        type: 'budget_exceeded',
        message: `Monthly budget exceeded! Spent ₹${this.currentMonthSpending} of ₹${this.monthlyBudget} budget.`,
        threshold: this.monthlyBudget,
        currentAmount: this.currentMonthSpending
      });
   }
  }
};
familyWalletSchema.methods.generate80DReport = function() {
  const fy = this.yearlySpending.financialYear;
  const maxDeduction = 25000; 
  const seniorCitizenLimit = 50000;
  
  return {
    financialYear: fy,
    totalMedicalExpenses: this.yearlySpending.totalMedicalExpenses,
    breakdown: { 
      consultations: this.yearlySpending.consultations,
      medicines: this.yearlySpending.medicines,
      labTests: this.yearlySpending.labTests,
      healthPackages: this.yearlySpending.healthPackages,
      insurance: this.yearlySpending.insurance
    },
    eligibleDeduction: Math.min(this.yearlySpending.totalMedicalExpenses, maxDeduction),
    seniorCitizenEligible: Math.min(this.yearlySpending.totalMedicalExpenses, seniorCitizenLimit),
    note: 'Please consult a tax professional for accurate deduction calculation.'
  };
};
familyWalletSchema.methods.resetMonthlySpending = function() {
  this.currentMonthSpending = 0;
  this.members.forEach(m => {
    m.currentMonthSpending = 0;
  });
};
familyWalletSchema.statics.getOrCreateWallet = async function(userId) {
  let wallet = await this.findOne({  primaryUserId: userId });
  if (!wallet) {
    wallet = await this.create({ primaryUserId: userId });
  }
  return wallet;
};

module.exports = mongoose.model('FamilyWallet', familyWalletSchema);

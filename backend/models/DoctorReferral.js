const mongoose = require('mongoose');

const referredDoctorSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  name: String,
  email: String,
  joinedAt: {
    type: Date,
    default: Date.now
  },
  bonusAppointmentsGiven: {
    type: Number,
    default: 25
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  firstAppointmentAt: Date
});

const doctorReferralSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true
  },
  referralCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  tier: {
    type: String,
    enum: ['launch', 'growth', 'standard', 'premium', 'loyalty'],
    default: 'launch'
  },
  
  commissionRate: {
    online: {
      type: Number,
      default: 0 
    },
    clinic: {
      type: Number,
      default: 0 
    }
  },
  appointmentCounts: {
    freeAppointments: {
      used: { type: Number, default: 0 },
      total: { type: Number, default: 50 }
    },
    reducedAppointments: {
      used: { type: Number, default: 0 },
      total: { type: Number, default: 100 }
    },
    totalAppointments: {
      type: Number,
      default: 0
    },
    thisMonthAppointments: {
      type: Number,
      default: 0
    }
  },
  earnings: {
    totalEarnings: { type: Number, default: 0 },
    totalCommissionPaid: { type: Number, default: 0 },
    totalCommissionSaved: { type: Number, default: 0 }, 
    thisMonthEarnings: { type: Number, default: 0 },
    thisMonthCommission: { type: Number, default: 0 }
  },
  referredDoctors: [referredDoctorSchema],
  referralStats: {
    totalReferred: { type: Number, default: 0 },
    verifiedReferred: { type: Number, default: 0 },
    bonusAppointmentsEarned: { type: Number, default: 0 }
  },
  milestones: [{
    type: {
      type: String,
      enum: ['first_appointment', 'fifty_appointments', 'hundred_appointments', 
             'five_hundred_appointments', 'thousand_appointments', 'first_referral',
             'five_referrals', 'ten_referrals', 'monthly_top_earner']
    },
    achievedAt: Date,
    reward: String,
    isNotified: { type: Boolean, default: false }
  }],
  badges: [{
    name: String,
    icon: String,
    description: String,
    earnedAt: Date
  }],
  lastMonthlyReset: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
doctorReferralSchema.index({ doctorId: 1 });
doctorReferralSchema.index({ referralCode: 1 });
doctorReferralSchema.index({ referredBy: 1 });
doctorReferralSchema.index({ tier: 1 });
doctorReferralSchema.statics.generateCode = async function(doctorName) {
  const prefix = doctorName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = 'DR' + prefix;
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.findOne({ referralCode: code });
    if (!existing) isUnique = true;
  }
  
  return code;
};
doctorReferralSchema.methods.calculateCommission = function(consultationFee, isOnline) {
  const counts = this.appointmentCounts;
  if (counts.freeAppointments.used < counts.freeAppointments.total) {
    return { commission: 0, tier: 'launch', message: 'Free appointment (Launch offer)' };
  }
  if (counts.reducedAppointments.used < counts.reducedAppointments.total) {
    const commission = 20; 
    return { commission, tier: 'growth', message: 'Reduced rate (₹20 flat)' };
  }
  let commission;
  if (isOnline) {
    commission = (consultationFee * this.commissionRate.online) / 100;
  } else {
    commission = this.commissionRate.clinic;
  }
  
  return { commission, tier: this.tier, message: `${this.tier} tier rate` };
};
doctorReferralSchema.methods.recordAppointment = function(consultationFee, isOnline) {
  const counts = this.appointmentCounts;
  const { commission, tier } = this.calculateCommission(consultationFee, isOnline);
  if (counts.freeAppointments.used < counts.freeAppointments.total) {
    counts.freeAppointments.used += 1;
  } else if (counts.reducedAppointments.used < counts.reducedAppointments.total) {
    counts.reducedAppointments.used += 1;
  }
  
  counts.totalAppointments += 1;
  counts.thisMonthAppointments += 1;
  const doctorEarning = consultationFee - commission;
  this.earnings.totalEarnings += doctorEarning;
  this.earnings.totalCommissionPaid += commission;
  this.earnings.thisMonthEarnings += doctorEarning;
  this.earnings.thisMonthCommission += commission;
  const competitorCommission = consultationFee * 0.20;
  this.earnings.totalCommissionSaved += (competitorCommission - commission);
  this.checkTierUpgrade();
  this.checkMilestones();
  
  return { commission, doctorEarning, tier };
};
doctorReferralSchema.methods.checkTierUpgrade = function() {
  const total = this.appointmentCounts.totalAppointments;
  
  if (total >= 1000 && this.tier !== 'loyalty') {
    this.tier = 'loyalty';
    this.commissionRate = { online: 5, clinic: 15 };
  } else if (total >= 500 && this.tier !== 'premium' && this.tier !== 'loyalty') {
    this.tier = 'premium';
    this.commissionRate = { online: 8, clinic: 20 };
  } else if (total >= 150 && !['premium', 'loyalty'].includes(this.tier)) {
    this.tier = 'standard';
    this.commissionRate = { online: 10, clinic: 25 };
  }
};
doctorReferralSchema.methods.checkMilestones = function() {
  const total = this.appointmentCounts.totalAppointments;
  const milestoneTypes = this.milestones.map(m => m.type);
  
  const milestonesToCheck = [
    { count: 1, type: 'first_appointment', reward: 'Welcome Badge' },
    { count: 50, type: 'fifty_appointments', reward: 'Rising Star Badge' },
    { count: 100, type: 'hundred_appointments', reward: 'Century Club Badge' },
    { count: 500, type: 'five_hundred_appointments', reward: 'Elite Doctor Badge' },
    { count: 1000, type: 'thousand_appointments', reward: 'Legend Badge + Loyalty Tier' }
  ];
  
  milestonesToCheck.forEach(m => {
    if (total >= m.count && !milestoneTypes.includes(m.type)) {
      this.milestones.push({
        type: m.type,
        achievedAt: new Date(),
        reward: m.reward
      });
      this.badges.push({
        name: m.reward,
        icon: this.getBadgeIcon(m.type),
        description: `Achieved ${m.count} appointments`,
        earnedAt: new Date()
      });
    }
  });
};
doctorReferralSchema.methods.getBadgeIcon = function(type) {
  const icons = {
    'first_appointment': '🎉',
    'fifty_appointments': '⭐',
    'hundred_appointments': '💯',
    'five_hundred_appointments': '🏆',
    'thousand_appointments': '👑',
    'first_referral': '🤝',
    'five_referrals': '🌟',
    'ten_referrals': '💎'
  };
  return icons[type] || '🏅';
};
doctorReferralSchema.methods.addReferralBonus = function(bonusCount = 25) {
  this.appointmentCounts.freeAppointments.total += bonusCount;
  this.referralStats.bonusAppointmentsEarned += bonusCount;
  const referralCount = this.referralStats.verifiedReferred;
  if (referralCount === 1 && !this.milestones.find(m => m.type === 'first_referral')) {
    this.milestones.push({
      type: 'first_referral',
      achievedAt: new Date(),
      reward: 'Referrer Badge'
    });
  }
};
doctorReferralSchema.methods.getCompetitorComparison = function() {
  const totalEarnings = this.earnings.totalEarnings + this.earnings.totalCommissionPaid;
  
  return {
    healthSyncPro: {
      commission: this.earnings.totalCommissionPaid,
      earnings: this.earnings.totalEarnings,
      rate: this.tier === 'launch' ? '0%' : 
            this.tier === 'growth' ? '₹20 flat' :
            `${this.commissionRate.online}% / ₹${this.commissionRate.clinic}`
    },
    practo: {
      commission: totalEarnings * 0.20,
      earnings: totalEarnings * 0.80,
      rate: '20%'
    },
    lybrate: {
      commission: totalEarnings * 0.15,
      earnings: totalEarnings * 0.85,
      rate: '15%'
    },
    savings: {
      vsPracto: (totalEarnings * 0.20) - this.earnings.totalCommissionPaid,
      vsLybrate: (totalEarnings * 0.15) - this.earnings.totalCommissionPaid
    }
  };
};
doctorReferralSchema.methods.resetMonthlyStats = function() {
  this.appointmentCounts.thisMonthAppointments = 0;
  this.earnings.thisMonthEarnings = 0;
  this.earnings.thisMonthCommission = 0;
  this.lastMonthlyReset = new Date();
};
doctorReferralSchema.statics.getOrCreateReferral = async function(doctorId, doctorName, referredByCode = null) {
  let referral = await this.findOne({ doctorId });
  
  if (!referral) {
    const code = await this.generateCode(doctorName);
    let referredBy = null;
    
    if (referredByCode) {
      const referrer = await this.findOne({ referralCode: referredByCode });
      if (referrer) {
        referredBy = referrer.doctorId;
      }
    }
    
    referral = await this.create({
      doctorId,
      referralCode: code,
      referredBy,
      tier: 'launch',
      commissionRate: { online: 0, clinic: 0 }
    });
  }
  
  return referral;
};

module.exports = mongoose.model('DoctorReferral', doctorReferralSchema);

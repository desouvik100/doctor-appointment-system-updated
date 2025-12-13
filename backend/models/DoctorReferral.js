const mongoose = require('mongoose');

/**
 * Doctor Referral System - Zero-commission launch program
 * Requirement 3: Doctor Earnings Protection
 */

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
  // Bonus appointments given to referrer
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
  // The doctor who is being tracked
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true
  },
  
  // Unique referral code for this doctor
  referralCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
  
  // Who referred this doctor (if any)
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  
  // Commission tier system
  tier: {
    type: String,
    enum: ['launch', 'growth', 'standard', 'premium', 'loyalty'],
    default: 'launch'
  },
  
  // Commission rates by tier
  // launch: 0% (first 50 appointments)
  // growth: ₹20 flat (next 100 appointments)
  // standard: 10% online, ₹25 clinic
  // premium: 8% online, ₹20 clinic (after 500 appointments)
  // loyalty: 5% online, ₹15 clinic (after 1000 appointments)
  
  commissionRate: {
    online: {
      type: Number,
      default: 0 // Percentage
    },
    clinic: {
      type: Number,
      default: 0 // Flat fee in rupees
    }
  },
  
  // Appointment counters
  appointmentCounts: {
    // Free tier (first 50)
    freeAppointments: {
      used: { type: Number, default: 0 },
      total: { type: Number, default: 50 }
    },
    // Reduced rate tier (next 100)
    reducedAppointments: {
      used: { type: Number, default: 0 },
      total: { type: Number, default: 100 }
    },
    // Total lifetime appointments
    totalAppointments: {
      type: Number,
      default: 0
    },
    // This month
    thisMonthAppointments: {
      type: Number,
      default: 0
    }
  },
  
  // Earnings tracking
  earnings: {
    totalEarnings: { type: Number, default: 0 },
    totalCommissionPaid: { type: Number, default: 0 },
    totalCommissionSaved: { type: Number, default: 0 }, // vs competitors
    thisMonthEarnings: { type: Number, default: 0 },
    thisMonthCommission: { type: Number, default: 0 }
  },
  
  // Doctors referred by this doctor
  referredDoctors: [referredDoctorSchema],
  
  // Referral stats
  referralStats: {
    totalReferred: { type: Number, default: 0 },
    verifiedReferred: { type: Number, default: 0 },
    bonusAppointmentsEarned: { type: Number, default: 0 }
  },
  
  // Milestones achieved
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
  
  // Badge system
  badges: [{
    name: String,
    icon: String,
    description: String,
    earnedAt: Date
  }],
  
  // Monthly stats reset date
  lastMonthlyReset: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
doctorReferralSchema.index({ doctorId: 1 });
doctorReferralSchema.index({ referralCode: 1 });
doctorReferralSchema.index({ referredBy: 1 });
doctorReferralSchema.index({ tier: 1 });

// Generate unique referral code
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

// Calculate commission for an appointment
doctorReferralSchema.methods.calculateCommission = function(consultationFee, isOnline) {
  const counts = this.appointmentCounts;
  
  // Check if still in free tier
  if (counts.freeAppointments.used < counts.freeAppointments.total) {
    return { commission: 0, tier: 'launch', message: 'Free appointment (Launch offer)' };
  }
  
  // Check if in reduced rate tier
  if (counts.reducedAppointments.used < counts.reducedAppointments.total) {
    const commission = 20; // ₹20 flat
    return { commission, tier: 'growth', message: 'Reduced rate (₹20 flat)' };
  }
  
  // Standard/Premium/Loyalty tiers
  let commission;
  if (isOnline) {
    commission = (consultationFee * this.commissionRate.online) / 100;
  } else {
    commission = this.commissionRate.clinic;
  }
  
  return { commission, tier: this.tier, message: `${this.tier} tier rate` };
};

// Record an appointment and update counters
doctorReferralSchema.methods.recordAppointment = function(consultationFee, isOnline) {
  const counts = this.appointmentCounts;
  const { commission, tier } = this.calculateCommission(consultationFee, isOnline);
  
  // Update counters
  if (counts.freeAppointments.used < counts.freeAppointments.total) {
    counts.freeAppointments.used += 1;
  } else if (counts.reducedAppointments.used < counts.reducedAppointments.total) {
    counts.reducedAppointments.used += 1;
  }
  
  counts.totalAppointments += 1;
  counts.thisMonthAppointments += 1;
  
  // Update earnings
  const doctorEarning = consultationFee - commission;
  this.earnings.totalEarnings += doctorEarning;
  this.earnings.totalCommissionPaid += commission;
  this.earnings.thisMonthEarnings += doctorEarning;
  this.earnings.thisMonthCommission += commission;
  
  // Calculate savings vs competitors (assuming 20% competitor rate)
  const competitorCommission = consultationFee * 0.20;
  this.earnings.totalCommissionSaved += (competitorCommission - commission);
  
  // Check for tier upgrade
  this.checkTierUpgrade();
  
  // Check for milestones
  this.checkMilestones();
  
  return { commission, doctorEarning, tier };
};

// Check and upgrade tier
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

// Check for milestones
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

// Get badge icon
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

// Add bonus appointments from referral
doctorReferralSchema.methods.addReferralBonus = function(bonusCount = 25) {
  this.appointmentCounts.freeAppointments.total += bonusCount;
  this.referralStats.bonusAppointmentsEarned += bonusCount;
  
  // Check referral milestones
  const referralCount = this.referralStats.verifiedReferred;
  if (referralCount === 1 && !this.milestones.find(m => m.type === 'first_referral')) {
    this.milestones.push({
      type: 'first_referral',
      achievedAt: new Date(),
      reward: 'Referrer Badge'
    });
  }
};

// Get comparison with competitors
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

// Reset monthly stats
doctorReferralSchema.methods.resetMonthlyStats = function() {
  this.appointmentCounts.thisMonthAppointments = 0;
  this.earnings.thisMonthEarnings = 0;
  this.earnings.thisMonthCommission = 0;
  this.lastMonthlyReset = new Date();
};

// Static: Get or create referral record
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

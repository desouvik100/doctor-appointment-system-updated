const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
  referredUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    firstAppointmentAt: Date,
    rewardGiven: {
      type: Boolean,
      default: false
    },
    rewardAmount: Number
  }],
  totalReferrals: {
    type: Number,
    default: 0
  },
  successfulReferrals: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  pendingEarnings: {
    type: Number,
    default: 0
  },
  withdrawnEarnings: {
    type: Number,
    default: 0
  },
  // Referral tiers
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  // Reward settings
  rewardPerReferral: {
    type: Number,
    default: 100 // ₹100 per successful referral
  },
  refereeDiscount: {
    type: Number,
    default: 50 // ₹50 discount for new user
  }
}, {
  timestamps: true
});

// Generate unique referral code
referralSchema.statics.generateCode = async function(userId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = 'HS';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.findOne({ referralCode: code });
    if (!existing) isUnique = true;
  }
  
  return code;
};

// Update tier based on successful referrals
referralSchema.methods.updateTier = function() {
  if (this.successfulReferrals >= 50) {
    this.tier = 'platinum';
    this.rewardPerReferral = 200;
  } else if (this.successfulReferrals >= 25) {
    this.tier = 'gold';
    this.rewardPerReferral = 150;
  } else if (this.successfulReferrals >= 10) {
    this.tier = 'silver';
    this.rewardPerReferral = 125;
  } else {
    this.tier = 'bronze';
    this.rewardPerReferral = 100;
  }
};

module.exports = mongoose.model('Referral', referralSchema);

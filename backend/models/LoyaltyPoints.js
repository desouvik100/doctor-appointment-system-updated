const mongoose = require('mongoose');

const loyaltyPointsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  availablePoints: {
    type: Number,
    default: 0
  },
  redeemedPoints: {
    type: Number,
    default: 0
  },
  expiredPoints: {
    type: Number,
    default: 0
  },
  // Membership tier
  tier: {
    type: String,
    enum: ['basic', 'silver', 'gold', 'platinum'],
    default: 'basic'
  },
  tierProgress: {
    type: Number,
    default: 0
  },
  // Points history
  transactions: [{
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired', 'bonus', 'referral']
    },
    points: Number,
    description: String,
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  // Streak tracking
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: Date,
  // Achievements
  achievements: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: Date,
    pointsAwarded: Number
  }]
}, {
  timestamps: true
});

// Points earning rates
const POINTS_CONFIG = {
  appointmentBooked: 10,
  appointmentCompleted: 50,
  reviewSubmitted: 25,
  referralSuccess: 100,
  profileCompleted: 50,
  firstAppointment: 100,
  streakBonus: 20, // Per day streak
  birthdayBonus: 200
};

// Tier thresholds
const TIER_THRESHOLDS = {
  basic: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000
};

// Add points
loyaltyPointsSchema.methods.addPoints = function(points, type, description, appointmentId = null) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Points expire in 1 year

  this.transactions.push({
    type,
    points,
    description,
    appointmentId,
    expiresAt
  });

  this.totalPoints += points;
  this.availablePoints += points;
  this.lastActivityDate = new Date();
  
  this.updateTier();
  this.checkAchievements();
};

// Redeem points
loyaltyPointsSchema.methods.redeemPoints = function(points, description) {
  if (points > this.availablePoints) {
    throw new Error('Insufficient points');
  }

  this.transactions.push({
    type: 'redeemed',
    points: -points,
    description
  });

  this.availablePoints -= points;
  this.redeemedPoints += points;
};

// Update tier based on total points
loyaltyPointsSchema.methods.updateTier = function() {
  if (this.totalPoints >= TIER_THRESHOLDS.platinum) {
    this.tier = 'platinum';
  } else if (this.totalPoints >= TIER_THRESHOLDS.gold) {
    this.tier = 'gold';
  } else if (this.totalPoints >= TIER_THRESHOLDS.silver) {
    this.tier = 'silver';
  } else {
    this.tier = 'basic';
  }

  // Calculate progress to next tier
  const tiers = ['basic', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(this.tier);
  if (currentIndex < tiers.length - 1) {
    const nextTier = tiers[currentIndex + 1];
    const currentThreshold = TIER_THRESHOLDS[this.tier];
    const nextThreshold = TIER_THRESHOLDS[nextTier];
    this.tierProgress = Math.round(((this.totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
  } else {
    this.tierProgress = 100;
  }
};

// Check and award achievements
loyaltyPointsSchema.methods.checkAchievements = function() {
  const achievements = [
    { name: 'First Steps', description: 'Earned your first points', threshold: 1, points: 10 },
    { name: 'Century', description: 'Earned 100 points', threshold: 100, points: 25 },
    { name: 'Half K', description: 'Earned 500 points', threshold: 500, points: 50 },
    { name: 'Thousand Club', description: 'Earned 1000 points', threshold: 1000, points: 100 },
    { name: 'Health Champion', description: 'Earned 5000 points', threshold: 5000, points: 250 }
  ];

  achievements.forEach(achievement => {
    const hasAchievement = this.achievements.some(a => a.name === achievement.name);
    if (!hasAchievement && this.totalPoints >= achievement.threshold) {
      this.achievements.push({
        name: achievement.name,
        description: achievement.description,
        icon: 'fa-trophy',
        earnedAt: new Date(),
        pointsAwarded: achievement.points
      });
      // Award bonus points for achievement
      this.availablePoints += achievement.points;
      this.totalPoints += achievement.points;
    }
  });
};

// Convert points to rupees (100 points = ₹10)
loyaltyPointsSchema.methods.getPointsValue = function() {
  return Math.floor(this.availablePoints / 10);
};

// Static method to get points config
loyaltyPointsSchema.statics.getPointsConfig = function() {
  return POINTS_CONFIG;
};

module.exports = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);

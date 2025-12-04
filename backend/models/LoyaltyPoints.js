const mongoose = require('mongoose');

const loyaltyTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'expired', 'bonus'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  referenceType: {
    type: String,
    enum: ['appointment', 'referral', 'review', 'signup', 'birthday', 'redemption', 'promotion'],
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceType'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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
  lifetimePoints: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  transactions: [loyaltyTransactionSchema],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Calculate tier based on lifetime points
loyaltyPointsSchema.methods.updateTier = function() {
  if (this.lifetimePoints >= 10000) {
    this.tier = 'platinum';
  } else if (this.lifetimePoints >= 5000) {
    this.tier = 'gold';
  } else if (this.lifetimePoints >= 2000) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }
};

// Add points
loyaltyPointsSchema.methods.addPoints = function(points, description, referenceType, referenceId) {
  this.totalPoints += points;
  this.lifetimePoints += points;
  this.transactions.push({
    type: 'earned',
    points,
    description,
    referenceType,
    referenceId
  });
  this.updateTier();
  this.lastActivity = new Date();
};

// Redeem points
loyaltyPointsSchema.methods.redeemPoints = function(points, description) {
  if (this.totalPoints < points) {
    throw new Error('Insufficient points');
  }
  this.totalPoints -= points;
  this.transactions.push({
    type: 'redeemed',
    points: -points,
    description,
    referenceType: 'redemption'
  });
  this.lastActivity = new Date();
};

module.exports = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);

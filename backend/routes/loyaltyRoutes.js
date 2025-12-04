const express = require('express');
const router = express.Router();
const LoyaltyPoints = require('../models/LoyaltyPoints');

// Points configuration
const POINTS_CONFIG = {
  appointment: 50,
  referral: 200,
  review: 30,
  signup: 100,
  birthday: 500,
  tierMultiplier: {
    bronze: 1,
    silver: 1.25,
    gold: 1.5,
    platinum: 2
  }
};

// Get user's loyalty points
router.get('/:userId', async (req, res) => {
  try {
    let loyalty = await LoyaltyPoints.findOne({ userId: req.params.userId });
    
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ userId: req.params.userId });
      await loyalty.save();
    }
    
    res.json({
      totalPoints: loyalty.totalPoints,
      lifetimePoints: loyalty.lifetimePoints,
      tier: loyalty.tier,
      transactions: loyalty.transactions.slice(-20).reverse(),
      nextTier: getNextTier(loyalty.tier, loyalty.lifetimePoints)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Award points for an action
router.post('/award', async (req, res) => {
  try {
    const { userId, action, referenceId, customPoints, description } = req.body;
    
    let loyalty = await LoyaltyPoints.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ userId });
    }
    
    let points = customPoints || POINTS_CONFIG[action] || 0;
    const multiplier = POINTS_CONFIG.tierMultiplier[loyalty.tier] || 1;
    points = Math.floor(points * multiplier);
    
    const desc = description || getActionDescription(action, points);
    loyalty.addPoints(points, desc, action, referenceId);
    await loyalty.save();
    
    res.json({
      success: true,
      pointsAwarded: points,
      totalPoints: loyalty.totalPoints,
      tier: loyalty.tier,
      message: `You earned ${points} points!`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Redeem points
router.post('/redeem', async (req, res) => {
  try {
    const { userId, points, rewardType, rewardDescription } = req.body;
    
    const loyalty = await LoyaltyPoints.findOne({ userId });
    if (!loyalty) {
      return res.status(404).json({ message: 'Loyalty account not found' });
    }
    
    loyalty.redeemPoints(points, rewardDescription || `Redeemed for ${rewardType}`);
    await loyalty.save();
    
    res.json({
      success: true,
      pointsRedeemed: points,
      remainingPoints: loyalty.totalPoints,
      message: 'Points redeemed successfully!'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get available rewards
router.get('/rewards/available', async (req, res) => {
  const rewards = [
    { id: 1, name: '₹50 Off Consultation', points: 500, type: 'discount', value: 50 },
    { id: 2, name: '₹100 Off Consultation', points: 900, type: 'discount', value: 100 },
    { id: 3, name: 'Free Health Checkup', points: 2000, type: 'service', value: 'basic_checkup' },
    { id: 4, name: '₹200 Medicine Voucher', points: 1500, type: 'voucher', value: 200 },
    { id: 5, name: 'Priority Booking', points: 300, type: 'perk', value: 'priority' },
    { id: 6, name: 'Free Video Consultation', points: 2500, type: 'service', value: 'video_consult' }
  ];
  res.json(rewards);
});

// Get leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const topUsers = await LoyaltyPoints.find()
      .sort({ lifetimePoints: -1 })
      .limit(10)
      .populate('userId', 'name');
    
    res.json(topUsers.map((u, i) => ({
      rank: i + 1,
      name: u.userId?.name || 'Anonymous',
      points: u.lifetimePoints,
      tier: u.tier
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper functions
function getNextTier(currentTier, points) {
  const tiers = {
    bronze: { next: 'silver', required: 2000 },
    silver: { next: 'gold', required: 5000 },
    gold: { next: 'platinum', required: 10000 },
    platinum: { next: null, required: null }
  };
  
  const tier = tiers[currentTier];
  if (!tier.next) return null;
  
  return {
    name: tier.next,
    pointsRequired: tier.required,
    pointsNeeded: tier.required - points,
    progress: Math.min((points / tier.required) * 100, 100)
  };
}

function getActionDescription(action, points) {
  const descriptions = {
    appointment: `Earned ${points} points for booking appointment`,
    referral: `Earned ${points} points for successful referral`,
    review: `Earned ${points} points for leaving a review`,
    signup: `Welcome bonus: ${points} points`,
    birthday: `Birthday bonus: ${points} points`
  };
  return descriptions[action] || `Earned ${points} points`;
}

module.exports = router;

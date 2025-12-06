const express = require('express');
const router = express.Router();
const LoyaltyPoints = require('../models/LoyaltyPoints');

// Get user's loyalty points
router.get('/user/:userId', async (req, res) => {
  try {
    let loyalty = await LoyaltyPoints.findOne({ userId: req.params.userId });
    
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ userId: req.params.userId });
      await loyalty.save();
    }

    res.json({
      totalPoints: loyalty.totalPoints,
      availablePoints: loyalty.availablePoints,
      redeemedPoints: loyalty.redeemedPoints,
      tier: loyalty.tier,
      tierProgress: loyalty.tierProgress,
      pointsValue: loyalty.getPointsValue(),
      currentStreak: loyalty.currentStreak,
      achievements: loyalty.achievements,
      recentTransactions: loyalty.transactions.slice(-10).reverse()
    });
  } catch (error) {
    console.error('Get loyalty points error:', error);
    res.status(500).json({ message: 'Failed to get loyalty points', error: error.message });
  }
});

// Add points (internal use - called after actions)
router.post('/add', async (req, res) => {
  try {
    const { userId, points, type, description, appointmentId } = req.body;

    let loyalty = await LoyaltyPoints.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ userId });
    }

    loyalty.addPoints(points, type, description, appointmentId);
    await loyalty.save();

    res.json({
      message: 'Points added successfully',
      newBalance: loyalty.availablePoints,
      totalPoints: loyalty.totalPoints
    });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({ message: 'Failed to add points', error: error.message });
  }
});

// Redeem points
router.post('/redeem', async (req, res) => {
  try {
    const { userId, points, description } = req.body;

    const loyalty = await LoyaltyPoints.findOne({ userId });
    if (!loyalty) {
      return res.status(404).json({ message: 'Loyalty account not found' });
    }

    if (points > loyalty.availablePoints) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    if (points < 100) {
      return res.status(400).json({ message: 'Minimum 100 points required for redemption' });
    }

    loyalty.redeemPoints(points, description || 'Points redeemed');
    await loyalty.save();

    const discountAmount = Math.floor(points / 10); // 100 points = ₹10

    res.json({
      message: 'Points redeemed successfully',
      pointsRedeemed: points,
      discountAmount,
      remainingPoints: loyalty.availablePoints
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(500).json({ message: 'Failed to redeem points', error: error.message });
  }
});

// Get transaction history
router.get('/history/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const loyalty = await LoyaltyPoints.findOne({ userId: req.params.userId });
    if (!loyalty) {
      return res.json({ transactions: [], total: 0 });
    }

    const transactions = loyalty.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice((page - 1) * limit, page * limit);

    res.json({
      transactions,
      total: loyalty.transactions.length,
      page: parseInt(page),
      totalPages: Math.ceil(loyalty.transactions.length / limit)
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to get history', error: error.message });
  }
});

// Get achievements
router.get('/achievements/:userId', async (req, res) => {
  try {
    const loyalty = await LoyaltyPoints.findOne({ userId: req.params.userId });
    
    const allAchievements = [
      { name: 'First Steps', description: 'Earned your first points', threshold: 1, icon: 'fa-baby' },
      { name: 'Century', description: 'Earned 100 points', threshold: 100, icon: 'fa-medal' },
      { name: 'Half K', description: 'Earned 500 points', threshold: 500, icon: 'fa-award' },
      { name: 'Thousand Club', description: 'Earned 1000 points', threshold: 1000, icon: 'fa-trophy' },
      { name: 'Health Champion', description: 'Earned 5000 points', threshold: 5000, icon: 'fa-crown' }
    ];

    const earnedNames = loyalty?.achievements.map(a => a.name) || [];

    res.json(allAchievements.map(a => ({
      ...a,
      earned: earnedNames.includes(a.name),
      earnedAt: loyalty?.achievements.find(ea => ea.name === a.name)?.earnedAt
    })));
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Failed to get achievements', error: error.message });
  }
});

// Get tier benefits
router.get('/tiers', async (req, res) => {
  try {
    const tiers = [
      {
        name: 'basic',
        displayName: 'Basic',
        threshold: 0,
        benefits: ['Earn 10 points per booking', 'Birthday bonus'],
        color: '#94a3b8'
      },
      {
        name: 'silver',
        displayName: 'Silver',
        threshold: 500,
        benefits: ['1.5x points on bookings', 'Priority support', 'Exclusive offers'],
        color: '#a8a29e'
      },
      {
        name: 'gold',
        displayName: 'Gold',
        threshold: 2000,
        benefits: ['2x points on bookings', 'Free rescheduling', 'Early access to features'],
        color: '#fbbf24'
      },
      {
        name: 'platinum',
        displayName: 'Platinum',
        threshold: 5000,
        benefits: ['3x points on bookings', 'Dedicated support', 'VIP perks', 'Free consultations'],
        color: '#a78bfa'
      }
    ];

    res.json(tiers);
  } catch (error) {
    console.error('Get tiers error:', error);
    res.status(500).json({ message: 'Failed to get tiers', error: error.message });
  }
});

// Calculate points for appointment
router.get('/calculate/:amount', async (req, res) => {
  try {
    const amount = parseInt(req.params.amount);
    const { userId } = req.query;

    let multiplier = 1;
    if (userId) {
      const loyalty = await LoyaltyPoints.findOne({ userId });
      if (loyalty) {
        switch (loyalty.tier) {
          case 'silver': multiplier = 1.5; break;
          case 'gold': multiplier = 2; break;
          case 'platinum': multiplier = 3; break;
        }
      }
    }

    // Base: 1 point per ₹10 spent
    const basePoints = Math.floor(amount / 10);
    const earnedPoints = Math.floor(basePoints * multiplier);

    res.json({
      basePoints,
      multiplier,
      earnedPoints,
      message: `You'll earn ${earnedPoints} points for this booking`
    });
  } catch (error) {
    console.error('Calculate points error:', error);
    res.status(500).json({ message: 'Failed to calculate points', error: error.message });
  }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await LoyaltyPoints.find({ totalPoints: { $gt: 0 } })
      .populate('userId', 'name profilePhoto')
      .sort({ totalPoints: -1 })
      .limit(10);

    res.json(leaderboard.map((l, index) => ({
      rank: index + 1,
      name: l.userId?.name || 'Anonymous',
      profilePhoto: l.userId?.profilePhoto,
      points: l.totalPoints,
      tier: l.tier
    })));
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Failed to get leaderboard', error: error.message });
  }
});

module.exports = router;

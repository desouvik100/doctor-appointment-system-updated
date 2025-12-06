const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const User = require('../models/User');
const LoyaltyPoints = require('../models/LoyaltyPoints');

// Get or create referral code for user
router.get('/code/:userId', async (req, res) => {
  try {
    let referral = await Referral.findOne({ referrerId: req.params.userId });
    
    if (!referral) {
      const code = await Referral.generateCode(req.params.userId);
      referral = new Referral({
        referrerId: req.params.userId,
        referralCode: code
      });
      await referral.save();
    }

    res.json({
      referralCode: referral.referralCode,
      referralLink: `${process.env.FRONTEND_URL || 'https://healthsyncpro.in'}?ref=${referral.referralCode}`,
      stats: {
        totalReferrals: referral.totalReferrals,
        successfulReferrals: referral.successfulReferrals,
        totalEarnings: referral.totalEarnings,
        pendingEarnings: referral.pendingEarnings,
        tier: referral.tier,
        rewardPerReferral: referral.rewardPerReferral
      }
    });
  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({ message: 'Failed to get referral code', error: error.message });
  }
});

// Apply referral code (when new user signs up)
router.post('/apply', async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;

    const referral = await Referral.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referral) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    // Check if user already referred
    const alreadyReferred = referral.referredUsers.some(
      u => u.userId.toString() === newUserId
    );
    if (alreadyReferred) {
      return res.status(400).json({ message: 'User already referred' });
    }

    // Check if referring self
    if (referral.referrerId.toString() === newUserId) {
      return res.status(400).json({ message: 'Cannot refer yourself' });
    }

    // Add referred user
    referral.referredUsers.push({
      userId: newUserId,
      joinedAt: new Date()
    });
    referral.totalReferrals += 1;
    await referral.save();

    // Give discount to new user (store in user profile or loyalty points)
    let loyaltyPoints = await LoyaltyPoints.findOne({ userId: newUserId });
    if (!loyaltyPoints) {
      loyaltyPoints = new LoyaltyPoints({ userId: newUserId });
    }
    loyaltyPoints.addPoints(
      referral.refereeDiscount * 10, // Convert to points
      'bonus',
      `Welcome bonus from referral code ${referralCode}`
    );
    await loyaltyPoints.save();

    res.json({
      message: 'Referral code applied successfully',
      discount: referral.refereeDiscount,
      bonusPoints: referral.refereeDiscount * 10
    });
  } catch (error) {
    console.error('Apply referral error:', error);
    res.status(500).json({ message: 'Failed to apply referral code', error: error.message });
  }
});

// Complete referral (when referred user completes first appointment)
router.post('/complete', async (req, res) => {
  try {
    const { referredUserId, appointmentId } = req.body;

    // Find referral containing this user
    const referral = await Referral.findOne({
      'referredUsers.userId': referredUserId,
      'referredUsers.rewardGiven': false
    });

    if (!referral) {
      return res.json({ message: 'No pending referral found' });
    }

    // Update referred user entry
    const userIndex = referral.referredUsers.findIndex(
      u => u.userId.toString() === referredUserId && !u.rewardGiven
    );

    if (userIndex !== -1) {
      referral.referredUsers[userIndex].firstAppointmentAt = new Date();
      referral.referredUsers[userIndex].rewardGiven = true;
      referral.referredUsers[userIndex].rewardAmount = referral.rewardPerReferral;

      referral.successfulReferrals += 1;
      referral.totalEarnings += referral.rewardPerReferral;
      referral.pendingEarnings += referral.rewardPerReferral;
      referral.updateTier();

      await referral.save();

      // Add loyalty points to referrer
      let referrerPoints = await LoyaltyPoints.findOne({ userId: referral.referrerId });
      if (!referrerPoints) {
        referrerPoints = new LoyaltyPoints({ userId: referral.referrerId });
      }
      referrerPoints.addPoints(
        referral.rewardPerReferral * 10,
        'referral',
        'Referral reward - friend completed first appointment'
      );
      await referrerPoints.save();

      res.json({
        message: 'Referral completed successfully',
        reward: referral.rewardPerReferral
      });
    } else {
      res.json({ message: 'Referral already completed' });
    }
  } catch (error) {
    console.error('Complete referral error:', error);
    res.status(500).json({ message: 'Failed to complete referral', error: error.message });
  }
});

// Get referral stats
router.get('/stats/:userId', async (req, res) => {
  try {
    const referral = await Referral.findOne({ referrerId: req.params.userId })
      .populate('referredUsers.userId', 'name email createdAt');

    if (!referral) {
      return res.json({
        totalReferrals: 0,
        successfulReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        tier: 'bronze',
        referredUsers: []
      });
    }

    res.json({
      totalReferrals: referral.totalReferrals,
      successfulReferrals: referral.successfulReferrals,
      totalEarnings: referral.totalEarnings,
      pendingEarnings: referral.pendingEarnings,
      withdrawnEarnings: referral.withdrawnEarnings,
      tier: referral.tier,
      rewardPerReferral: referral.rewardPerReferral,
      referredUsers: referral.referredUsers.map(u => ({
        name: u.userId?.name || 'User',
        joinedAt: u.joinedAt,
        completed: u.rewardGiven,
        reward: u.rewardAmount
      }))
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Failed to get stats', error: error.message });
  }
});

// Validate referral code
router.get('/validate/:code', async (req, res) => {
  try {
    const referral = await Referral.findOne({ 
      referralCode: req.params.code.toUpperCase() 
    }).populate('referrerId', 'name');

    if (!referral) {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      referrerName: referral.referrerId?.name,
      discount: referral.refereeDiscount
    });
  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({ message: 'Failed to validate code', error: error.message });
  }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Referral.find({ successfulReferrals: { $gt: 0 } })
      .populate('referrerId', 'name profilePhoto')
      .sort({ successfulReferrals: -1 })
      .limit(10);

    res.json(leaderboard.map((r, index) => ({
      rank: index + 1,
      name: r.referrerId?.name || 'Anonymous',
      profilePhoto: r.referrerId?.profilePhoto,
      referrals: r.successfulReferrals,
      tier: r.tier
    })));
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Failed to get leaderboard', error: error.message });
  }
});

module.exports = router;

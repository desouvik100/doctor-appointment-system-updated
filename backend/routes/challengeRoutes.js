const express = require('express');
const router = express.Router();
const HealthChallenge = require('../models/HealthChallenge');
const LoyaltyPoints = require('../models/LoyaltyPoints');

// Get all active challenges
router.get('/', async (req, res) => {
  try {
    const challenges = await HealthChallenge.find({ 
      isActive: true,
      endDate: { $gte: new Date() }
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's challenges
router.get('/user/:userId', async (req, res) => {
  try {
    const challenges = await HealthChallenge.find({
      'participants.userId': req.params.userId,
      isActive: true
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join a challenge
router.post('/:challengeId/join', async (req, res) => {
  try {
    const { userId } = req.body;
    const challenge = await HealthChallenge.findById(req.params.challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    const alreadyJoined = challenge.participants.find(p => p.userId.toString() === userId);
    if (alreadyJoined) {
      return res.status(400).json({ message: 'Already joined this challenge' });
    }
    
    challenge.participants.push({ userId, progress: 0 });
    await challenge.save();
    
    res.json({ message: 'Joined challenge successfully', challenge });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update progress
router.post('/:challengeId/progress', async (req, res) => {
  try {
    const { userId, value } = req.body;
    const challenge = await HealthChallenge.findById(req.params.challengeId);
    
    const participant = challenge.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      return res.status(404).json({ message: 'Not participating in this challenge' });
    }
    
    participant.progress += value;
    participant.dailyLogs.push({ date: new Date(), value });
    
    // Check if completed
    if (participant.progress >= challenge.target && !participant.completed) {
      participant.completed = true;
      participant.completedAt = new Date();
      
      // Award points
      let loyalty = await LoyaltyPoints.findOne({ userId });
      if (!loyalty) {
        loyalty = await LoyaltyPoints.create({ userId });
      }
      await loyalty.addPoints(challenge.rewardPoints, `Completed: ${challenge.title}`, 'challenge', challenge._id);
    }
    
    await challenge.save();
    res.json({ message: 'Progress updated', participant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create challenge (admin)
router.post('/', async (req, res) => {
  try {
    const challenge = new HealthChallenge(req.body);
    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get leaderboard for a challenge
router.get('/:challengeId/leaderboard', async (req, res) => {
  try {
    const challenge = await HealthChallenge.findById(req.params.challengeId)
      .populate('participants.userId', 'name profilePhoto');
    
    const leaderboard = challenge.participants
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 20);
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

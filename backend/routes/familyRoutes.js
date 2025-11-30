const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user's family members
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('familyMembers');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.familyMembers || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching family members', error: error.message });
  }
});

// Add family member
router.post('/:userId', async (req, res) => {
  try {
    const { name, relationship, age, gender, phone, bloodGroup, allergies, chronicConditions } = req.body;

    if (!name || !relationship) {
      return res.status(400).json({ message: 'Name and relationship are required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.familyMembers = user.familyMembers || [];
    const newMember = {
      name,
      relationship,
      age,
      gender,
      phone,
      bloodGroup,
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      createdAt: new Date()
    };

    user.familyMembers.push(newMember);
    await user.save();

    res.status(201).json({ 
      message: 'Family member added', 
      familyMember: user.familyMembers[user.familyMembers.length - 1],
      familyMembers: user.familyMembers 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding family member', error: error.message });
  }
});

// Update family member
router.put('/:userId/:memberId', async (req, res) => {
  try {
    const { userId, memberId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const memberIndex = user.familyMembers?.findIndex(m => m._id.toString() === memberId);
    if (memberIndex === -1 || memberIndex === undefined) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdAt') {
        user.familyMembers[memberIndex][key] = updates[key];
      }
    });

    await user.save();

    res.json({ 
      message: 'Family member updated', 
      familyMember: user.familyMembers[memberIndex],
      familyMembers: user.familyMembers 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating family member', error: error.message });
  }
});

// Delete family member
router.delete('/:userId/:memberId', async (req, res) => {
  try {
    const { userId, memberId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.familyMembers = user.familyMembers?.filter(m => m._id.toString() !== memberId) || [];
    await user.save();

    res.json({ message: 'Family member removed', familyMembers: user.familyMembers });
  } catch (error) {
    res.status(500).json({ message: 'Error removing family member', error: error.message });
  }
});

module.exports = router;

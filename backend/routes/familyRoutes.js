const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all family members for a user (from User model's embedded array)
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('familyMembers');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ familyMembers: user.familyMembers || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add family member to user's embedded array
router.post('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newMember = {
      ...req.body,
      createdAt: new Date()
    };

    user.familyMembers = user.familyMembers || [];
    user.familyMembers.push(newMember);
    await user.save();

    // Return the newly added member (last one in array)
    const addedMember = user.familyMembers[user.familyMembers.length - 1];
    res.status(201).json({ 
      message: 'Family member added',
      member: addedMember 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update family member
router.put('/:userId/:memberId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const memberIndex = user.familyMembers?.findIndex(
      m => m._id.toString() === req.params.memberId
    );

    if (memberIndex === -1 || memberIndex === undefined) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Update the member
    Object.assign(user.familyMembers[memberIndex], req.body);
    await user.save();

    res.json({ 
      message: 'Family member updated',
      member: user.familyMembers[memberIndex]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete family member from embedded array
router.delete('/:userId/:memberId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.familyMembers = user.familyMembers?.filter(
      m => m._id.toString() !== req.params.memberId
    ) || [];
    await user.save();

    res.json({ message: 'Family member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single family member
router.get('/:userId/member/:memberId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('familyMembers');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const member = user.familyMembers?.find(
      m => m._id.toString() === req.params.memberId
    );

    if (!member) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

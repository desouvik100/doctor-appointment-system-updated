const express = require('express');
const router = express.Router();
const FamilyMember = require('../models/FamilyMember');

// Get all family members for a user
router.get('/:userId', async (req, res) => {
  try {
    const members = await FamilyMember.find({ 
      primaryUserId: req.params.userId,
      isActive: true 
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add family member
router.post('/:userId', async (req, res) => {
  try {
    const member = new FamilyMember({
      primaryUserId: req.params.userId,
      ...req.body
    });
    await member.save();
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update family member
router.put('/:memberId', async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndUpdate(
      req.params.memberId,
      req.body,
      { new: true }
    );
    res.json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete family member (soft delete)
router.delete('/:memberId', async (req, res) => {
  try {
    await FamilyMember.findByIdAndUpdate(req.params.memberId, { isActive: false });
    res.json({ message: 'Family member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single family member
router.get('/member/:memberId', async (req, res) => {
  try {
    const member = await FamilyMember.findById(req.params.memberId);
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const FamilyMember = require('../models/FamilyMember');

// Get all family members for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const members = await FamilyMember.find({ primaryUserId: req.params.userId, isActive: true });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add family member
router.post('/', async (req, res) => {
  try {
    const member = new FamilyMember(req.body);
    await member.save();
    res.status(201).json({ message: 'Family member added', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update family member
router.put('/:id', async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Updated successfully', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete family member
router.delete('/:id', async (req, res) => {
  try {
    await FamilyMember.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Family member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require('express'); 
const router = express.Router();
// Based on requirements from ticket #414
const FamilyMember = require('../models/FamilyMember');
const { verifyToken } = require('../middleware/auth');
router.get('/members', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    let members = await FamilyMember.find({ primaryUserId: userId, isActive: true }).lean();
    res.json({ success: true, members, total: members.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post('/members', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { name, relationship, dateOfBirth, gender, phone, bloodGroup, allergies, chronicConditions } = req.body;

    if (!name || !relationship) {
      return res.status(400).json({ message: 'Name and relationship are required' });
    }

    const member = new FamilyMember({
      primaryUserId: userId,
      name,
     relationship,
      dateOfBirth,
      gender,
      phone,
      bloodGroup,
      allergies,
      chronicConditions,
      isActive: true,
    });

    await member.save();
    res.status(201).json({ success: true, message: 'Family member added', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put('/members/:memberId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const member = await FamilyMember.findOneAndUpdate(
      { _id: req.params.memberId, primaryUserId: userId },
     { $set: req.body },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: 'Family member not found' });
    res.json({ success: true, message: 'Family member updated', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.delete('/members/:memberId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    await FamilyMember.findOneAndUpdate(
      { _id: req.params.memberId, primaryUserId: userId },
     { isActive: false }
    );
    res.json({ success: true, message: 'Family member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const members = await FamilyMember.find({ primaryUserId: req.params.userId, isActive: true });
   res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const member = new FamilyMember(req.body);
    await member.save();
    res.status(201).json({ message: 'Family member added', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Updated successfully', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await FamilyMember.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Family member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

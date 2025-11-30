const express = require('express');
const router = express.Router();
const FavoriteDoctor = require('../models/FavoriteDoctor');

// Get user's favorite doctors
router.get('/user/:userId', async (req, res) => {
  try {
    const favorites = await FavoriteDoctor.find({ userId: req.params.userId })
      .populate({
        path: 'doctorId',
        select: 'name specialization consultationFee rating reviewCount profilePhoto clinicId',
        populate: { path: 'clinicId', select: 'name city' }
      });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to favorites
router.post('/', async (req, res) => {
  try {
    const { userId, doctorId, notes } = req.body;
    
    const existing = await FavoriteDoctor.findOne({ userId, doctorId });
    if (existing) {
      return res.status(400).json({ message: 'Doctor already in favorites' });
    }

    const favorite = new FavoriteDoctor({ userId, doctorId, notes });
    await favorite.save();
    res.status(201).json({ message: 'Added to favorites', favorite });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from favorites
router.delete('/:userId/:doctorId', async (req, res) => {
  try {
    await FavoriteDoctor.findOneAndDelete({
      userId: req.params.userId,
      doctorId: req.params.doctorId
    });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if doctor is favorite
router.get('/check/:userId/:doctorId', async (req, res) => {
  try {
    const favorite = await FavoriteDoctor.findOne({
      userId: req.params.userId,
      doctorId: req.params.doctorId
    });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

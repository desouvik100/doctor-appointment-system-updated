const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { verifyToken } = require('../middleware/auth');

// GET /api/favorites — get current user's favorites (authenticated)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const user = await User.findById(userId)
      .populate({
        path: 'favoriteDoctors',
        populate: { path: 'clinicId', select: 'name address city phone' }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, favorites: user.favoriteDoctors || [] });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Error fetching favorites', error: error.message });
  }
});

// POST /api/favorites — add to favorites (authenticated)
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.favoriteDoctors?.includes(doctorId)) {
      return res.status(400).json({ message: 'Doctor already in favorites' });
    }

    user.favoriteDoctors = user.favoriteDoctors || [];
    user.favoriteDoctors.push(doctorId);
    await user.save();

    res.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding favorite', error: error.message });
  }
});

// DELETE /api/favorites/:doctorId — remove from favorites (authenticated)
router.delete('/:doctorId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { doctorId } = req.params;

    await User.findByIdAndUpdate(userId, {
      $pull: { favoriteDoctors: doctorId }
    });

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing favorite', error: error.message });
  }
});

// Get user's favorite doctors (legacy endpoint)
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate({
        path: 'favoriteDoctors',
        populate: { path: 'clinicId', select: 'name address city phone' }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ favorites: user.favoriteDoctors || [] });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Error fetching favorites', error: error.message });
  }
});

// Add doctor to favorites (POST /:userId with body)
router.post('/:userId', async (req, res) => {
  try {
    const { doctorId } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already in favorites
    if (user.favoriteDoctors?.includes(doctorId)) {
      return res.status(400).json({ message: 'Doctor already in favorites' });
    }

    user.favoriteDoctors = user.favoriteDoctors || [];
    user.favoriteDoctors.push(doctorId);
    await user.save();

    res.json({ message: 'Doctor added to favorites', favoriteDoctors: user.favoriteDoctors });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Error adding favorite', error: error.message });
  }
});

// Remove doctor from favorites (DELETE /:userId/:doctorId)
router.delete('/:userId/:doctorId', async (req, res) => {
  try {
    const { userId, doctorId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.favoriteDoctors = user.favoriteDoctors?.filter(
      id => id.toString() !== doctorId
    ) || [];
    await user.save();

    res.json({ message: 'Doctor removed from favorites', favoriteDoctors: user.favoriteDoctors });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Error removing favorite', error: error.message });
  }
});

// Add doctor to favorites
router.post('/:userId/add', async (req, res) => {
  try {
    const { doctorId } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already in favorites
    if (user.favoriteDoctors?.includes(doctorId)) {
      return res.status(400).json({ message: 'Doctor already in favorites' });
    }

    user.favoriteDoctors = user.favoriteDoctors || [];
    user.favoriteDoctors.push(doctorId);
    await user.save();

    res.json({ message: 'Doctor added to favorites', favoriteDoctors: user.favoriteDoctors });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Error adding favorite', error: error.message });
  }
});

// Remove doctor from favorites
router.post('/:userId/remove', async (req, res) => {
  try {
    const { doctorId } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.favoriteDoctors = user.favoriteDoctors?.filter(
      id => id.toString() !== doctorId
    ) || [];
    await user.save();

    res.json({ message: 'Doctor removed from favorites', favoriteDoctors: user.favoriteDoctors });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Error removing favorite', error: error.message });
  }
});

// Check if doctor is favorite
router.get('/:userId/check/:doctorId', async (req, res) => {
  try {
    const { userId, doctorId } = req.params;

    const user = await User.findById(userId).select('favoriteDoctors');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFavorite = user.favoriteDoctors?.some(id => id.toString() === doctorId) || false;
    res.json({ isFavorite });
  } catch (error) {
    res.status(500).json({ message: 'Error checking favorite', error: error.message });
  }
});

// Toggle favorite
router.post('/:userId/toggle', async (req, res) => {
  try {
    const { doctorId } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.favoriteDoctors = user.favoriteDoctors || [];
    const index = user.favoriteDoctors.findIndex(id => id.toString() === doctorId);
    
    let isFavorite;
    if (index > -1) {
      user.favoriteDoctors.splice(index, 1);
      isFavorite = false;
    } else {
      user.favoriteDoctors.push(doctorId);
      isFavorite = true;
    }
    
    await user.save();

    res.json({ 
      message: isFavorite ? 'Added to favorites' : 'Removed from favorites',
      isFavorite,
      favoriteDoctors: user.favoriteDoctors 
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Error toggling favorite', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Update user location
router.post('/update-location', async (req, res) => {
  try {
    const { userId, latitude, longitude, city, country } = req.body;

    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ 
        message: 'User ID, latitude, and longitude are required' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update location
    user.loginLocation = {
      latitude,
      longitude,
      city: city || null,
      country: country || null,
      lastUpdated: new Date()
    };

    await user.save();

    res.json({ 
      message: 'Location updated successfully',
      location: user.loginLocation
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      message: 'Error updating location', 
      error: error.message 
    });
  }
});

// Get user location
router.get('/get-location/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('loginLocation');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      location: user.loginLocation || null
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ 
      message: 'Error fetching location', 
      error: error.message 
    });
  }
});

module.exports = router;

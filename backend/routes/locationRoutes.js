const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Update user location
router.post('/update-location', async (req, res) => {
  try {
    const { userId, latitude, longitude, address, city, state, country, pincode } = req.body;

    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ 
        message: 'User ID, latitude, and longitude are required' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update location with full address details
    user.loginLocation = {
      latitude,
      longitude,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
      pincode: pincode || null,
      lastUpdated: new Date()
    };
    
    // Mark location as captured
    user.locationCaptured = true;

    await user.save();

    res.json({ 
      success: true,
      message: 'Location updated successfully',
      location: user.loginLocation,
      locationCaptured: true
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating location', 
      error: error.message 
    });
  }
});

// Get user location
router.get('/get-location/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('loginLocation locationCaptured');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      location: user.loginLocation || null,
      locationCaptured: user.locationCaptured || false
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ 
      message: 'Error fetching location', 
      error: error.message 
    });
  }
});

// Check if user needs location setup (first-time login)
router.get('/check-location-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('locationCaptured loginLocation');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      needsLocationSetup: !user.locationCaptured,
      locationCaptured: user.locationCaptured || false,
      hasLocation: !!(user.loginLocation?.latitude && user.loginLocation?.longitude)
    });
  } catch (error) {
    console.error('Error checking location status:', error);
    res.status(500).json({ 
      message: 'Error checking location status', 
      error: error.message 
    });
  }
});

module.exports = router;

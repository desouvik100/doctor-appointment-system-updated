const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Update profile photo
router.post('/update-photo', async (req, res) => {
  try {
    const { userId, profilePhoto } = req.body;

    if (!userId || !profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'User ID and profile photo are required'
      });
    }

    // Validate base64 image or URL
    const isBase64 = profilePhoto.startsWith('data:image/');
    const isUrl = profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://');

    if (!isBase64 && !isUrl) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile photo format'
      });
    }

    // Update user profile photo
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile photo',
      error: error.message
    });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// Delete profile photo
router.delete('/delete-photo/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: null },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile photo deleted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile photo',
      error: error.message
    });
  }
});

module.exports = router;

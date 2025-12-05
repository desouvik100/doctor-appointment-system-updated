const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Test route to verify profile routes are loaded
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Profile routes are working!' });
});

// Update profile photo
router.post('/update-photo', async (req, res) => {
  try {
    const { userId, profilePhoto } = req.body;

    console.log('📸 Update photo request received');
    console.log('📸 userId:', userId);
    console.log('📸 Photo data length:', profilePhoto?.length || 0);
    console.log('📸 Photo starts with:', profilePhoto?.substring(0, 50));

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
      console.log('❌ Invalid photo format');
      return res.status(400).json({
        success: false,
        message: 'Invalid profile photo format. Must be base64 image or URL.'
      });
    }

    // Update user profile photo
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto },
      { new: true }
    ).select('-password');

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile photo updated for:', user.email);

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
    console.error('❌ Update photo error:', error);
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

// Update full profile (name, phone, photo)
router.put('/update/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, profilePhoto } = req.body;

    console.log('📝 Full profile update for userId:', userId);

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile updated for:', user.email);

    res.json({
      success: true,
      message: 'Profile updated successfully',
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
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

module.exports = router;

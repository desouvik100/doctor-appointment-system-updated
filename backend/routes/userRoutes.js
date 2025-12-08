const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const aiSecurityService = require('../services/aiSecurityService');
const router = express.Router();

// Security helper - log account operations
const logAccountOperation = async (req, action, targetUser, details = {}) => {
  try {
    // Get admin info from request (if available)
    const adminId = req.body?.adminId || req.headers['x-admin-id'];
    
    await aiSecurityService.analyzeActivity({
      userId: adminId,
      userType: 'Admin',
      userName: 'Admin',
      action: action,
      endpoint: req.originalUrl,
      method: req.method,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      requestBody: {
        action,
        targetUserId: targetUser?._id,
        targetUserEmail: targetUser?.email,
        ...details
      }
    });
  } catch (error) {
    console.error('Security logging error:', error);
  }
};

// Get all users (Admin only)
router.get('/', async (req, res) => {
  try {
    // Include all users for admin dashboard (both active and inactive)
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    
    const users = await User.find(filter)
      .populate('clinicId', 'name address city phone')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('clinicId', 'name address city phone');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new user (Admin only)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, role, clinicId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // If role is receptionist, verify clinic exists
    if (role === 'receptionist' && clinicId) {
      const clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        return res.status(400).json({ message: 'Clinic not found' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: role || 'patient',
      clinicId: (role === 'receptionist' && clinicId) ? clinicId : null,
      // Admin-created receptionists are auto-approved
      approvalStatus: (role === 'receptionist') ? 'approved' : undefined
    });

    await user.save();

    // Log account creation for security monitoring
    await logAccountOperation(req, 'create_user', user, { role: user.role });

    const populatedUser = await User.findById(user._id)
      .populate('clinicId', 'name address city phone');

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // If password is provided, hash it
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // If role is receptionist and clinicId is provided, verify clinic exists
    if (updateData.role === 'receptionist' && updateData.clinicId) {
      const clinic = await Clinic.findById(updateData.clinicId);
      if (!clinic) {
        return res.status(400).json({ message: 'Clinic not found' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('clinicId', 'name address city phone');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    // Get user before deletion for logging
    const userToDelete = await User.findById(req.params.id);
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log account deletion for security monitoring
    await logAccountOperation(req, 'delete_user', userToDelete, { action: 'deactivate' });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
module.exports = router;
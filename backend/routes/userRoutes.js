const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const aiSecurityService = require('../services/aiSecurityService');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current logged-in user
 *     description: Returns the profile of the currently authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search user by phone or email
 *     description: Search for a user by phone number or email (for walk-in patient lookup)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Phone or email required
 *       404:
 *         description: User not found
 */

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

// Get current logged-in user info
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('name email phone role clinicId clinicName emrPlan profilePhoto department');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      clinicId: user.clinicId,
      clinicName: user.clinicName,
      emrPlan: user.emrPlan || 'basic',
      profilePhoto: user.profilePhoto,
      department: user.department
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search user by phone (for walk-in patient lookup)
router.get('/search', async (req, res) => {
  try {
    const { phone, email } = req.query;
    
    if (!phone && !email) {
      return res.status(400).json({ message: 'Phone or email required for search' });
    }

    const query = {};
    if (phone) query.phone = { $regex: phone, $options: 'i' };
    if (email) query.email = { $regex: email, $options: 'i' };

    const user = await User.findOne(query)
      .select('name email phone profilePhoto');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error searching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (Admin only)
router.get('/', verifyTokenWithRole(['admin']), async (req, res) => {
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
router.post('/', verifyTokenWithRole(['admin']), async (req, res) => {
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

// Register patient (staff registration endpoint)
router.post('/register-patient', verifyToken, async (req, res) => {
  try {
    const { 
      name, phone, email, dateOfBirth, gender, bloodType, 
      address, emergencyContact, allergies, clinicId, registeredBy 
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and phone are required' 
      });
    }

    // Check if user with phone already exists
    let user = await User.findOne({ phone });
    
    if (user) {
      // Link existing user to clinic if not already linked
      if (clinicId && !user.clinicLinks?.some(link => link.clinicId?.toString() === clinicId)) {
        user.clinicLinks = user.clinicLinks || [];
        user.clinicLinks.push({ clinicId, linkedAt: new Date() });
        await user.save();
      }
      return res.json({ 
        success: true, 
        user, 
        isNew: false,
        message: 'Patient already exists' 
      });
    }

    // Create new patient user
    user = new User({
      name,
      phone,
      email: email || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      bloodType: bloodType || undefined,
      address: address || undefined,
      emergencyContact: emergencyContact || undefined,
      allergies: allergies || undefined,
      role: 'patient',
      registeredByClinic: clinicId,
      registeredBy: registeredBy || req.user?.id,
      registrationType: 'staff_registered',
      isActive: true,
      clinicLinks: clinicId ? [{ clinicId, linkedAt: new Date() }] : []
    });

    await user.save();

    res.status(201).json({ 
      success: true, 
      user, 
      isNew: true,
      message: 'Patient registered successfully' 
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
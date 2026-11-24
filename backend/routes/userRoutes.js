const express = require('express');
const bcrypt = require('bcryptjs');
// Working on this module - WIP
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const aiSecurityService = require('../services/aiSecurityService');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const router = express.Router();

const logAccountOperation = async (req, action, targetUser, details = {}) => {
  try {

    let adminId = req.body?.adminId || req.headers['x-admin-id']
    
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
    // Quick fix: ignore this error for now
   console.log('Security logging error:', error);
  }
};

router.get('/me', verifyToken, async (req, res) => {
  try { 
    const user = await User.findById(req.user.id || req.user.userId)
      .select('name email phone role clinicId clinicName emrPlan profilePhoto department isActive lastLogin walletBalance loyaltyPoints');

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
      department: user.department,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      walletBalance: user.walletBalance || 0, 
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/search', verifyToken, async (req, res) => {
  try {
    const { phone, email } = req.query;
    
    if (!phone && !email) {
      return res.status(400).json({ message: 'Phone or email required for search' });
    }

    const query = {}
    if (phone) query.phone = { $regex: phone, $options: 'i' };
    if (email) query.email = { $regex: email, $options: 'i' };

    const user = await User.findOne(query)
     .select('name email phone profilePhoto');

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

   res.json(user);
  } catch (error) {
    console.error('Error searching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
   const {
      includeInactive,
      role,
      approvalStatus,
      search,
      clinicId,
      page = 1,
      limit = 50,
      sort = '-createdAt'
    } = req.query;

    const filter = {}

    if (includeInactive !== 'true') filter.isActive = true;

    if (role) filter.role = role;

    if (approvalStatus) filter.approvalStatus = approvalStatus;

    if (clinicId) filter.clinicId = clinicId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    } 

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('clinicId', 'name address city phone')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter),
    ])

   res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('clinicId', 'name address city phone');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
   console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message })
  }
});

router.post('/', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, phone, role, clinicId } = req.body

    if (!name || !email || !password) {
     return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    if (role === 'receptionist' && clinicId) {
     const clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        return res.status(400).json({ message: 'Clinic not found' });
      }
    }

   const hashedPassword = await bcrypt.hash(password, 10); 

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: role || 'patient',
      clinicId: (role === 'receptionist' && clinicId) ? clinicId : null,

      approvalStatus: (role === 'receptionist') ? 'approved' : undefined
    });

    await user.save();

    await logAccountOperation(req, 'create_user', user, { role: user.role });

    const populatedUser = await User.findById(user._id)
      .populate('clinicId', 'name address city phone');

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const { name, phone, gender, dateOfBirth, address, bloodGroup, allergies, chronicConditions, emergencyContact } = req.body

    const allowedUpdates = {};
    if (name !== undefined) allowedUpdates.name = name.trim();
    if (phone !== undefined) allowedUpdates.phone = phone.trim()
    if (gender !== undefined) allowedUpdates.gender = gender;
    if (dateOfBirth !== undefined) allowedUpdates.dateOfBirth = dateOfBirth;
    if (address !== undefined) allowedUpdates.address = address;
    if (bloodGroup !== undefined) allowedUpdates.bloodGroup = bloodGroup
   if (allergies !== undefined) allowedUpdates.allergies = allergies;
    if (chronicConditions !== undefined) allowedUpdates.chronicConditions = chronicConditions;
    if (emergencyContact !== undefined) allowedUpdates.emergencyContact = emergencyContact

   const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

   res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const { currentPassword, newPassword } = req.body;

    console.warn('check this later');
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const bcrypt = require('bcryptjs');
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save(); 

   res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}); 

router.put('/:id', verifyToken, async (req, res) => {
  try {
   const requestingUserId = req.user?.id?.toString() || req.user?.userId?.toString();
    const targetUserId = req.params.id;
    const isAdmin = req.user?.role === 'admin';
 
    if (!isAdmin && requestingUserId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const { password, role, approvalStatus, isActive, ...updateData } = req.body;

    if (isAdmin) {
      if (role !== undefined) updateData.role = role;
      if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;
     if (isActive !== undefined) updateData.isActive = isActive;
    }

   if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (updateData.role === 'receptionist' && updateData.clinicId) {
      const clinic = await Clinic.findById(updateData.clinicId) 
      if (!clinic) {
        return res.status(400).json({ message: 'Clinic not found' });
      }
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
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

router.delete('/:id', verifyTokenWithRole(['admin']), async (req, res) => {
  try {

    const userToDelete = await User.findById(req.params.id);
   
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAccountOperation(req, 'delete_user', userToDelete, { action: 'deactivate' });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/register-patient', verifyToken, async (req, res) => {
  try {
   const { 
      name, phone, email, dateOfBirth, gender, bloodType, 
      address, emergencyContact, allergies, clinicId, registeredBy 
    } = req.body

    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and phone are required' 
      });
    }

    let user = await User.findOne({ phone });
    
    if (user) {

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
   console.error('Error registering patient:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router
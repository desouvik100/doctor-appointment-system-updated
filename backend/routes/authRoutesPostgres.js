
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/UserPostgres');
const { identifyTenant, ensureTenantContext, validateTenantAccess } = require('../middleware/tenantMiddleware');
const auth = require('../middleware/authMiddleware');
router.use(identifyTenant);
router.use(ensureTenantContext);
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
const isValidPassword = (password) => {
  return password && password.length >= 6;
};
router.get('/test', (req, res) => {
  res.json({ 
    message: 'PostgreSQL Auth routes are working!',
    tenant: req.tenant.name,
    tenantId: req.tenantId
  });
});
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Name, email, and password are required' 
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Please enter a valid email address' 
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Password must be at least 6 characters long' 
      });
    }
    const existing = await User.findByEmail(email, req.tenantId);
    if (existing) {
      return res.status(400).json({ 
        error: 'User exists',
        message: 'Email already registered in this organization' 
      });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient'
    }, req.tenantId);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toSafeJSON(),
      tenant: {
        id: req.tenant.id,
        name: req.tenant.name,
        subdomain: req.tenant.subdomain
      }
    });

  } catch (err) {
    console.error('Error in register:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Email and password are required' 
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Please enter a valid email address' 
      });
    }
    const user = await User.findByEmail(email, req.tenantId);
    if (!user) {
      return res.status(400).json({ 
        error: 'Authentication failed',
        message: 'Invalid email or password' 
      });
    }
    const isMatch = await user.verifyPassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Authentication failed',
        message: 'Invalid email or password' 
      });
    }
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        clinicId: user.clinicId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeJSON(),
      tenant: {
        id: req.tenant.id,
        name: req.tenant.name,
        subdomain: req.tenant.subdomain
      }
    });

  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});
router.get('/me', auth(), validateTenantAccess, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId, req.tenantId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found in this tenant' 
      });
    }

    res.json({ 
      user: user.toSafeJSON(),
      tenant: {
        id: req.tenant.id,
        name: req.tenant.name,
        subdomain: req.tenant.subdomain
      }
    });

  } catch (err) {
    console.error('Error in /me:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});
router.put('/assign-clinic', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const { userId, clinicId } = req.body;

    if (!userId || !clinicId) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'userId and clinicId are required' 
      });
    }

    const user = await User.findById(userId, req.tenantId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found in this tenant' 
      });
    }

    await user.update({ clinic_id: clinicId });

    res.json({
      message: 'Clinic assigned successfully',
      user: user.toSafeJSON()
    });

  } catch (err) {
    console.error('Error assigning clinic:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});
router.get('/users', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const { role, clinicId, search, page = 1, limit = 50 } = req.query;
    
    const filters = {};
    if (role) filters.role = role;
    if (clinicId) filters.clinicId = clinicId;
    if (search) filters.search = search;
    filters.limit = Math.min(parseInt(limit), 100); 
    filters.offset = (parseInt(page) - 1) * filters.limit;

    const users = await User.findAll(req.tenantId, filters);
    const stats = await User.getStats(req.tenantId);

    res.json({
      users: users.map(user => user.toSafeJSON()),
      pagination: {
        page: parseInt(page),
        limit: filters.limit,
        hasMore: users.length === filters.limit
      },
      stats
    });

  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});
router.post('/admin/create-user', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const { name, email, password, role, clinicId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Name, email, password, and role are required' 
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Please enter a valid email address' 
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Password must be at least 6 characters long' 
      });
    }
    if (!['admin', 'receptionist', 'user', 'patient'].includes(role)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Invalid role. Must be admin, receptionist, user, or patient' 
      });
    }
    const existing = await User.findByEmail(email, req.tenantId);
    if (existing) {
      return res.status(400).json({ 
        error: 'User exists',
        message: 'Email already registered in this organization' 
      });
    }

    const userData = {
      name,
      email,
      password,
      role
    };
    if (clinicId && role === 'receptionist') {
      userData.clinicId = clinicId;
    }

    const user = await User.create(userData, req.tenantId);

    res.status(201).json({
      message: 'User created successfully',
      user: user.toSafeJSON()
    });

  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});
router.delete('/admin/delete-user/:id', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id, req.tenantId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found in this tenant' 
      });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Cannot delete admin users' 
      });
    }

    const deletedUser = await user.delete();

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: deletedUser.id,
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role
      }
    });

  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});
router.put('/admin/update-user/:id', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, clinicId, password } = req.body;

    const user = await User.findById(id, req.tenantId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found in this tenant' 
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Please enter a valid email address' 
        });
      }
      updateData.email = email;
    }
    if (role && ['admin', 'receptionist', 'user', 'patient'].includes(role)) {
      updateData.role = role;
    }
    if (clinicId !== undefined) {
      updateData.clinic_id = clinicId || null;
    }
    await user.update(updateData);
    if (password) {
      if (!isValidPassword(password)) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Password must be at least 6 characters long' 
        });
      }
      await user.updatePassword(password);
    }

    res.json({
      message: 'User updated successfully',
      user: user.toSafeJSON()
    });

  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});
router.put('/profile', auth(), validateTenantAccess, async (req, res) => {
  try {
    const { name, profile } = req.body;

    const user = await User.findById(req.user.userId, req.tenantId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found in this tenant' 
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (profile) updateData.profile = { ...user.profile, ...profile };

    await user.update(updateData);

    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeJSON()
    });

  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});
router.put('/change-password', auth(), validateTenantAccess, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Current password and new password are required' 
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'New password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(req.user.userId, req.tenantId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found in this tenant' 
      });
    }
    const isMatch = await user.verifyPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Authentication failed',
        message: 'Current password is incorrect' 
      });
    }

    await user.updatePassword(newPassword);

    res.json({
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

module.exports = router;
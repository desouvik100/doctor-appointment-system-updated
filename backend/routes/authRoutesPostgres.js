// routes/authRoutesPostgres.js - PostgreSQL-based auth routes with tenant support
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/UserPostgres');
const { identifyTenant, ensureTenantContext, validateTenantAccess } = require('../middleware/tenantMiddleware');
const auth = require('../middleware/authMiddleware');

// Apply tenant middleware to all routes
router.use(identifyTenant);
router.use(ensureTenantContext);

// Email validation helper function
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation helper function
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'PostgreSQL Auth routes are working!',
    tenant: req.tenant.name,
    tenantId: req.tenantId
  });
});

// REGISTER
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Name, email, and password are required' 
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Please enter a valid email address' 
      });
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists in this tenant
    const existing = await User.findByEmail(email, req.tenantId);
    if (existing) {
      return res.status(400).json({ 
        error: 'User exists',
        message: 'Email already registered in this organization' 
      });
    }

    // Create user in current tenant
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

// LOGIN
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Email and password are required' 
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Please enter a valid email address' 
      });
    }

    // Find user in current tenant
    const user = await User.findByEmail(email, req.tenantId);
    if (!user) {
      return res.status(400).json({ 
        error: 'Authentication failed',
        message: 'Invalid email or password' 
      });
    }

    // Verify password
    const isMatch = await user.verifyPassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Authentication failed',
        message: 'Invalid email or password' 
      });
    }

    // Create JWT token with tenant context
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

// GET CURRENT LOGGED-IN USER
// GET /api/auth/me
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

// ASSIGN CLINIC TO USER (for admin use)
// PUT /api/auth/assign-clinic
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

// GET ALL USERS (for admin use)
// GET /api/auth/users
router.get('/users', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const { role, clinicId, search, page = 1, limit = 50 } = req.query;
    
    const filters = {};
    if (role) filters.role = role;
    if (clinicId) filters.clinicId = clinicId;
    if (search) filters.search = search;
    
    // Pagination
    filters.limit = Math.min(parseInt(limit), 100); // Max 100 per page
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

// CREATE USER (admin only - for creating receptionists/doctors)
// POST /api/auth/admin/create-user
router.post('/admin/create-user', auth('admin'), validateTenantAccess, async (req, res) => {
  try {
    const { name, email, password, role, clinicId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Name, email, password, and role are required' 
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Please enter a valid email address' 
      });
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Validate role
    if (!['admin', 'receptionist', 'user', 'patient'].includes(role)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Invalid role. Must be admin, receptionist, user, or patient' 
      });
    }

    // Check if user already exists in this tenant
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

    // Add clinicId if provided (for receptionists)
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

// DELETE USER (admin only)
// DELETE /api/auth/admin/delete-user/:id
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

    // Prevent deleting admin users (safety measure)
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

// UPDATE USER (admin only)
// PUT /api/auth/admin/update-user/:id
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

    // Update fields if provided
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

    // Update user
    await user.update(updateData);

    // Update password separately if provided
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

// UPDATE USER PROFILE (self-service)
// PUT /api/auth/profile
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

// CHANGE PASSWORD (self-service)
// PUT /api/auth/change-password
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

    // Verify current password
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
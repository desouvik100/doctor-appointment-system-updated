const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: role || 'patient'
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        locationCaptured: false // New users haven't captured location yet
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user (only patients can login through this route)
    const user = await User.findOne({ email, role: 'patient', isActive: true });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        locationCaptured: user.locationCaptured || false,
        loginLocation: user.loginLocation || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find admin user
    const user = await User.findOne({ email, role: 'admin', isActive: true });
    if (!user) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clinic/Receptionist login
router.post('/clinic/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find receptionist user
    const user = await User.findOne({ 
      email, 
      role: 'receptionist', 
      isActive: true,
      approvalStatus: 'approved' // Only approved receptionists can login
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid receptionist credentials or account not approved' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid receptionist credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        clinicId: user.clinicId,
        clinicName: user.clinicName,
        approvalStatus: user.approvalStatus,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    console.error('Receptionist login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test route to verify receptionist routes are accessible
router.get('/receptionist/test', (req, res) => {
  res.json({ message: 'Receptionist routes are working' });
});

// Receptionist sign-up
router.post('/receptionist/register', async (req, res) => {
  try {
    const { name, email, password, phone, clinicName } = req.body;

    // Validate required fields
    if (!name || !email || !password || !clinicName) {
      return res.status(400).json({ message: 'Name, email, password, and clinic name are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create receptionist user with pending status
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: 'receptionist',
      approvalStatus: 'pending',
      clinicName: clinicName
    });

    try {
      await user.save();
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      // Handle validation errors
      if (saveError.name === 'ValidationError') {
        const errors = Object.values(saveError.errors).map(err => err.message);
        return res.status(400).json({ message: errors.join(', ') });
      }
      if (saveError.code === 11000) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      throw saveError;
    }

    res.status(201).json({
      message: 'Receptionist registration submitted successfully. Please wait for admin approval.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        clinicName: user.clinicName
      }
    });
  } catch (error) {
    console.error('Receptionist registration error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Forgot Password - Send OTP for password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({ 
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.' 
      });
    }

    // Import email service
    const { sendOTP } = require('../services/emailService');

    // Send OTP for password reset
    const result = await sendOTP(email, 'password-reset');

    console.log(`✅ Password reset OTP sent to: ${email}`);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process password reset request',
      error: error.message 
    });
  }
});

// Reset Password (after OTP verification)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, OTP, and new password are required' 
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Import email service
    const { verifyOTP } = require('../services/emailService');

    // Verify OTP
    const otpVerification = verifyOTP(email, otp, 'password-reset');
    if (!otpVerification.success) {
      return res.status(400).json({ 
        success: false,
        message: otpVerification.message 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ Password reset successful for: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reset password',
      error: error.message 
    });
  }
});

module.exports = router;

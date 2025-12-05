const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const LoyaltyPoints = require('../models/LoyaltyPoints');

const router = express.Router();

// Send OTP for registration
router.post('/send-registration-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Import email service and send OTP
    const { sendOTP } = require('../services/emailService');
    const result = await sendOTP(normalizedEmail, 'registration');

    console.log(`✅ Registration OTP sent to: ${normalizedEmail}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    });

  } catch (error) {
    console.error('❌ Send registration OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
});

// Verify OTP for registration
router.post('/verify-registration-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Import email service and verify OTP
    const { verifyOTP } = require('../services/emailService');
    const verification = verifyOTP(normalizedEmail, otp, 'registration');

    if (!verification.success) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    console.log(`✅ Registration OTP verified for: ${normalizedEmail}`);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now complete registration.',
      verified: true
    });

  } catch (error) {
    console.error('❌ Verify registration OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
});

// Register (requires OTP verification first)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, otpVerified } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if OTP was verified (skip for Google sign-in which sets otpVerified: true)
    if (!otpVerified) {
      return res.status(400).json({ message: 'Please verify your email with OTP first' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || '',
      role: role || 'patient'
    });

    await user.save();

    // Award signup bonus loyalty points
    let signupBonus = null;
    try {
      const loyalty = new LoyaltyPoints({ userId: user._id });
      loyalty.addPoints(100, 'Welcome bonus: 100 points for signing up!', 'signup', user._id);
      await loyalty.save();
      signupBonus = 100;
      console.log(`🎁 Awarded 100 signup bonus points to new user ${user._id}`);
    } catch (loyaltyError) {
      console.error('Error creating loyalty account:', loyaltyError);
    }

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
      },
      loyaltyBonus: signupBonus
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

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Find user (only patients can login through this route)
    const user = await User.findOne({ email: normalizedEmail, role: 'patient', isActive: true });
    if (!user) {
      console.log(`❌ Login failed: User not found for email: ${normalizedEmail}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log(`🔐 Attempting login for: ${normalizedEmail}`);
    console.log(`🔐 Stored password hash starts with: ${user.password.substring(0, 20)}...`);
    console.log(`🔐 Input password length: ${password.length}`);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🔐 Password match result: ${isMatch}`);
    if (!isMatch) {
      console.log(`❌ Login failed: Password mismatch for ${normalizedEmail}`);
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

// One-time admin setup route (use once then remove)
router.post('/setup-admin', async (req, res) => {
  try {
    const { secretKey } = req.body;
    
    // Security: require a secret key to prevent unauthorized access
    if (secretKey !== 'healthsync-admin-setup-2024') {
      return res.status(403).json({ message: 'Invalid secret key' });
    }
    
    const adminEmail = 'admin@healthsyncpro.in';
    const adminPassword = 'Admin@123';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Update or create admin
    const result = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        approvalStatus: 'approved',
        isActive: true
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Admin created/updated:', adminEmail);
    
    res.json({
      success: true,
      message: 'Admin account created successfully',
      email: adminEmail
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ message: 'Failed to create admin', error: error.message });
  }
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

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({ 
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.' 
      });
    }

    // Import email service
    const { sendOTP } = require('../services/emailService');

    // Send OTP for password reset (use normalized email for consistency)
    const result = await sendOTP(normalizedEmail, 'password-reset');

    console.log(`✅ Password reset OTP sent to: ${normalizedEmail}`);

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

// Clinic/Receptionist Reset Password (after OTP verification - OTP already verified)
router.post('/clinic/reset-password', async (req, res) => {
  try {
    console.log('📧 Clinic reset password request:', { email: req.body.email });
    
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email' 
      });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    console.log(`✅ Password reset successful for: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('❌ Clinic reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
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

    // Normalize email to lowercase (must match how it was stored during forgot-password)
    const normalizedEmail = email.toLowerCase().trim();

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Import email service
    const { verifyOTP } = require('../services/emailService');

    // Verify OTP (use normalized email to match the stored OTP key)
    const otpVerification = verifyOTP(normalizedEmail, otp, 'password-reset');
    if (!otpVerification.success) {
      return res.status(400).json({ 
        success: false,
        message: otpVerification.message 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`🔐 Resetting password for user: ${normalizedEmail}`);
    console.log(`🔐 New password hash: ${hashedPassword.substring(0, 20)}...`);

    // Update password using findByIdAndUpdate to avoid any potential pre-save hooks
    const updateResult = await User.findByIdAndUpdate(
      user._id, 
      { password: hashedPassword },
      { new: true }
    );
    
    if (!updateResult) {
      console.log(`❌ Failed to update password for: ${normalizedEmail}`);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to update password in database' 
      });
    }
    
    // Verify the update by re-fetching the user
    const verifyUser = await User.findById(user._id);
    console.log(`🔐 Password updated in DB. New hash starts with: ${updateResult.password.substring(0, 20)}...`);
    console.log(`🔐 Verification - DB hash starts with: ${verifyUser.password.substring(0, 20)}...`);
    console.log(`🔐 Hashes match: ${updateResult.password === verifyUser.password}`);
    console.log(`✅ Password reset successful for: ${normalizedEmail}`);

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

// ==========================================
// DOCTOR AUTHENTICATION
// ==========================================

// Doctor Login
router.post('/doctor/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find doctor by email
    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim(), isActive: true })
      .populate('clinicId', 'name address city phone');

    if (!doctor) {
      return res.status(400).json({ message: 'Invalid credentials or doctor not found' });
    }

    // Check approval status
    if (doctor.approvalStatus === 'pending') {
      return res.status(403).json({ 
        message: 'Your account is pending admin approval. Please wait for confirmation.',
        status: 'pending'
      });
    }

    if (doctor.approvalStatus === 'rejected') {
      return res.status(403).json({ 
        message: 'Your account has been rejected. Please contact admin.',
        status: 'rejected',
        reason: doctor.rejectionReason
      });
    }

    // Check if doctor has set up password
    if (!doctor.password) {
      return res.status(400).json({ 
        message: 'Please set up your password first',
        needsPasswordSetup: true,
        doctorEmail: doctor.email
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    doctor.lastLogin = new Date();
    await doctor.save();

    // Generate token
    const token = jwt.sign(
      { doctorId: doctor._id, role: 'doctor' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        clinicId: doctor.clinicId,
        profilePhoto: doctor.profilePhoto,
        qualification: doctor.qualification,
        experience: doctor.experience
      }
    });
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Doctor Password Setup (first time)
router.post('/doctor/setup-password', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Find doctor by email
    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found with this email' });
    }

    if (doctor.password) {
      return res.status(400).json({ message: 'Password already set. Please use login or reset password.' });
    }

    // Hash and save password
    const hashedPassword = await bcrypt.hash(password, 10);
    doctor.password = hashedPassword;
    doctor.isVerified = true;
    await doctor.save();

    res.json({
      success: true,
      message: 'Password set successfully. You can now login.'
    });
  } catch (error) {
    console.error('Doctor password setup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Doctor Reset Password
router.post('/doctor/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    doctor.password = hashedPassword;
    await doctor.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Doctor reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==========================================
// GOOGLE SIGN-IN
// ==========================================

// Google Sign-In for Patients (login or register)
router.post('/google-signin', async (req, res) => {
  try {
    const { email, name, googleId, profilePhoto } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Email and Google ID are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let isNewUser = false;

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // User exists - update Google ID and profile photo if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (profilePhoto && !user.profilePhoto) {
        user.profilePhoto = profilePhoto;
      }
      await user.save();
    } else {
      // Create new user with Google
      isNewUser = true;
      
      // Generate a random password for Google users (they won't use it)
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = new User({
        name: name || email.split('@')[0],
        email: normalizedEmail,
        password: hashedPassword,
        googleId: googleId,
        profilePhoto: profilePhoto || null,
        role: 'patient',
        isActive: true
      });

      await user.save();

      // Award signup bonus loyalty points for new Google users
      try {
        const loyalty = new LoyaltyPoints({ userId: user._id });
        loyalty.addPoints(100, 'Welcome bonus: 100 points for signing up with Google!', 'signup', user._id);
        await loyalty.save();
        console.log(`🎁 Awarded 100 signup bonus points to new Google user ${user._id}`);
      } catch (loyaltyError) {
        console.error('Error creating loyalty account:', loyaltyError);
      }
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log(`✅ Google sign-in successful for: ${normalizedEmail} (${isNewUser ? 'new user' : 'existing user'})`);

    res.json({
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        locationCaptured: user.locationCaptured || false
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google Sign-In for Doctors
router.post('/doctor/google-signin', async (req, res) => {
  try {
    const { email, name, googleId, profilePhoto } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Email and Google ID are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if doctor exists
    let doctor = await Doctor.findOne({ email: normalizedEmail });

    if (doctor) {
      // Doctor exists - check approval status
      if (doctor.approvalStatus === 'pending') {
        return res.status(403).json({ 
          message: 'Your account is pending admin approval. Please wait for confirmation.',
          status: 'pending'
        });
      }

      if (doctor.approvalStatus === 'rejected') {
        return res.status(403).json({ 
          message: 'Your account has been rejected. Please contact admin.',
          status: 'rejected'
        });
      }

      // Update Google ID and profile photo if not set
      if (!doctor.googleId) {
        doctor.googleId = googleId;
      }
      if (profilePhoto && !doctor.profilePhoto) {
        doctor.profilePhoto = profilePhoto;
      }
      doctor.lastLogin = new Date();
      await doctor.save();

      // Generate token
      const token = jwt.sign(
        { doctorId: doctor._id, role: 'doctor' },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      console.log(`✅ Doctor Google sign-in successful for: ${normalizedEmail}`);

      return res.json({
        token,
        isNewUser: false,
        doctor: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          phone: doctor.phone,
          specialization: doctor.specialization,
          clinicId: doctor.clinicId,
          profilePhoto: doctor.profilePhoto,
          qualification: doctor.qualification,
          experience: doctor.experience
        }
      });
    } else {
      // Doctor doesn't exist - return error (doctors must register first)
      return res.status(404).json({ 
        message: 'No doctor account found with this email. Please register first or contact admin.',
        needsRegistration: true
      });
    }
  } catch (error) {
    console.error('Doctor Google sign-in error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google Sign-In for Staff/Receptionist
router.post('/clinic/google-signin', async (req, res) => {
  try {
    const { email, name, googleId, profilePhoto } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Email and Google ID are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if staff user exists
    let user = await User.findOne({ email: normalizedEmail, role: 'receptionist' });

    if (user) {
      // Staff exists - check approval status
      if (user.approvalStatus === 'pending') {
        return res.status(403).json({ 
          message: 'Your account is pending admin approval. Please wait for confirmation.',
          status: 'pending'
        });
      }

      if (user.approvalStatus === 'rejected') {
        return res.status(403).json({ 
          message: 'Your account has been rejected. Please contact admin.',
          status: 'rejected'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          message: 'Your account is inactive. Please contact admin.',
          status: 'inactive'
        });
      }

      // Update Google ID and profile photo if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (profilePhoto && !user.profilePhoto) {
        user.profilePhoto = profilePhoto;
      }
      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      console.log(`✅ Staff Google sign-in successful for: ${normalizedEmail}`);

      return res.json({
        token,
        isNewUser: false,
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
    } else {
      // Staff doesn't exist - return error (staff must register first)
      return res.status(404).json({ 
        message: 'No staff account found with this email. Please register first or contact admin.',
        needsRegistration: true
      });
    }
  } catch (error) {
    console.error('Staff Google sign-in error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

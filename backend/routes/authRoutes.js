const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const { loginLimiter, registrationLimiter, otpLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/send-registration-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    const { sendOTP } = require('../services/emailService');
    const result = await sendOTP(normalizedEmail, 'registration');

    console.log(`✅ Registration OTP sent to: ${normalizedEmail}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    });

  } catch (error) {
    console.error('❌ Send registration OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
});

router.post('/verify-registration-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
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

router.post('/register', registrationLimiter, async (req, res) => {
  try {
    const { name, email, password, phone, role, otpVerified } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!otpVerified) {
      return res.status(400).json({ message: 'Please verify your email with OTP first' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || '',
      role: role || 'patient'
    });

    await user.save();
    let signupBonus = null;
    try {
      const loyalty = new LoyaltyPoints({ userId: user._id });
      loyalty.addPoints(100, 'earned', 'Welcome bonus: 100 points for signing up!', user._id);
      await loyalty.save();
      signupBonus = 100;
      console.log(`🎁 Awarded 100 signup bonus points to new user ${user._id}`);
    } catch (loyaltyError) {
      console.error('Error creating loyalty account:', loyaltyError);
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, clinicId: user.clinicId || null },
      process.env.JWT_SECRET,
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
        clinicId: user.clinicId || null,
        locationCaptured: false 
      },
      loyaltyBonus: signupBonus
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const aiSecurityService = require('../services/aiSecurityService');
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    const userCheck = await User.findOne({ email: normalizedEmail, role: 'patient' });
    if (userCheck && userCheck.isActive === false) {
      console.log(`🚫 Login blocked: User suspended - ${normalizedEmail}`);
      return res.status(403).json({ 
        message: 'Your account has been suspended',
        reason: userCheck.suspendReason || 'Contact admin for more information',
        suspended: true
      });
    }
    const user = userCheck && userCheck.isActive !== false ? userCheck : null;
    if (!user) {
      console.log(`❌ Login failed: User not found for email: ${normalizedEmail}`);
      await aiSecurityService.trackFailedLogin(normalizedEmail, ipAddress, userAgent);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log(`🔐 Attempting login for: ${normalizedEmail}`);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ Login failed: Password mismatch for ${normalizedEmail}`);
      await aiSecurityService.trackFailedLogin(normalizedEmail, ipAddress, userAgent);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, clinicId: user.clinicId || null },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      lastLoginIP: req.ip || req.headers['x-forwarded-for']
    }).catch(() => {});

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        clinicId: user.clinicId || null,
        locationCaptured: user.locationCaptured || false,
        loginLocation: user.loginLocation || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const aiSecurityService = require('../services/aiSecurityService');
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const userCheck = await User.findOne({ email, role: 'admin' });
    if (userCheck && userCheck.isActive === false) {
      console.log(`🚫 Admin login blocked: Account suspended - ${email}`);
      return res.status(403).json({ 
        message: 'Your admin account has been suspended',
        reason: userCheck.suspendReason || 'Contact system administrator',
        suspended: true
      });
    }
    const user = userCheck && userCheck.isActive !== false ? userCheck : null;
    if (!user) {
      console.log(`❌ Admin login failed: User not found or inactive - ${email}`);
      await aiSecurityService.trackFailedLogin(email, ipAddress, userAgent);
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await aiSecurityService.trackFailedLogin(email, ipAddress, userAgent);
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, clinicId: null },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const loginTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const adminEmailAddr = process.env.ADMIN_EMAIL || user.email;
    setImmediate(async () => {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        transporter.sendMail({
        from: `"HealthSync Pro Security" <${process.env.EMAIL_USER}>`,
        to: adminEmailAddr,
        subject: '🔐 Admin Login Alert - HealthSync Pro',
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Admin Login Alert</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <strong style="color: #92400e;">⚠️ Security Notice</strong>
                <p style="margin: 5px 0 0 0; color: #78350f;">A successful admin login was detected on your HealthSync Pro account.</p>
              </div>
              
              <h3 style="color: #1e293b; margin-bottom: 15px;">Login Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px 0; color: #64748b; width: 40%;">👤 Admin Name</td>
                  <td style="padding: 12px 0; color: #1e293b; font-weight: 600;">${user.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px 0; color: #64748b;">📧 Email</td>
                  <td style="padding: 12px 0; color: #1e293b; font-weight: 600;">${user.email}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px 0; color: #64748b;">🕐 Login Time</td>
                  <td style="padding: 12px 0; color: #1e293b; font-weight: 600;">${loginTime}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px 0; color: #64748b;">🌐 IP Address</td>
                  <td style="padding: 12px 0; color: #1e293b; font-weight: 600;">${ipAddress || 'Unknown'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b;">💻 Device</td>
                  <td style="padding: 12px 0; color: #1e293b; font-size: 12px;">${userAgent ? userAgent.substring(0, 80) + '...' : 'Unknown'}</td>
                </tr>
              </table>
              
              <div style="margin-top: 25px; padding: 15px; background: #f1f5f9; border-radius: 8px;">
                <p style="margin: 0; color: #475569; font-size: 14px;">
                  <strong>🛡️ If this wasn't you:</strong> Please secure your account immediately by changing your password and reviewing recent activity.
                </p>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
              <p>© ${new Date().getFullYear()} HealthSync Pro. All rights reserved.</p>
              <p>This is an automated security notification.</p>
            </div>
          </div>
        `,
        text: `Admin Login Alert\n\nA successful admin login was detected.\n\nAdmin: ${user.name}\nEmail: ${user.email}\nTime: ${loginTime}\nIP: ${ipAddress || 'Unknown'}\n\nIf this wasn't you, please secure your account immediately.`
        }).then(() => {
          console.log(`📧 Admin login notification sent to ${adminEmailAddr}`);
        }).catch((emailError) => {
          console.error('Failed to send admin login email:', emailError.message);
        });
      } catch (emailError) {
        console.error('Failed to send admin login email:', emailError.message);
      }
    });

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

router.post('/clinic/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const anyUser = await User.findOne({ 
      email: normalizedEmail, 
      role: { $in: ['receptionist', 'clinic'] }
    });
    if (!anyUser) {
      const otherUser = await User.findOne({ email: normalizedEmail });
      if (otherUser) {
        console.log(`⚠️ Login attempt with non-staff email: ${normalizedEmail} (role: ${otherUser.role})`);
        return res.status(400).json({ 
          message: 'This email is not registered as a staff account. If you registered as a patient, please use the patient login instead.',
          wrongRole: true
        });
      }
      return res.status(400).json({ 
        message: 'No staff account found with this email. Please register first or check your email address.',
        notFound: true
      });
    }
    if (anyUser && anyUser.approvalStatus === 'pending') {
      console.log(`⏳ Receptionist login blocked: Pending approval - ${normalizedEmail}`);
      return res.status(403).json({ 
        message: 'Your account is pending admin approval. You will receive a confirmation email within 24–48 hours.',
        pending: true
      });
    }
    if (anyUser && anyUser.approvalStatus === 'rejected') {
      console.log(`❌ Receptionist login blocked: Rejected - ${normalizedEmail}`);
      return res.status(403).json({ 
        message: 'Your account registration was rejected. Please contact admin at support@healthsyncpro.in for assistance.',
        rejected: true
      });
    }
    const userCheck = await User.findOne({ 
      email: normalizedEmail, 
      role: { $in: ['receptionist', 'clinic'] },
      approvalStatus: 'approved'
    });
    if (userCheck && userCheck.isActive === false) {
      console.log(`🚫 Receptionist login blocked: Account suspended - ${normalizedEmail}`);
      return res.status(403).json({ 
        message: 'Your account has been suspended',
        reason: userCheck.suspendReason || 'Contact admin for more information',
        suspended: true
      });
    }
    const user = userCheck && userCheck.isActive !== false ? userCheck : null;
    
    if (!user) {
      return res.status(400).json({ message: 'No approved staff account found with this email. Please contact admin.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid receptionist credentials' });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, clinicId: user.clinicId || null },
      process.env.JWT_SECRET,
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
        profilePhoto: user.profilePhoto,
        assignedDoctorId: user.assignedDoctorId || null,
        department: user.department || null,
        emrPlan: user.emrPlan || 'basic'
      }
    });
  } catch (error) {
    console.error('Receptionist login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/receptionist/test', (req, res) => {
  res.json({ message: 'Receptionist routes are working' });
});
router.post('/receptionist/register', async (req, res) => {
  try {
    const { name, email, password, phone, clinicName, emailVerified, otpToken } = req.body;
    if (!name || !email || !password || !clinicName) {
      return res.status(400).json({ message: 'Name, email, password, and clinic name are required' });
    }
    if (!emailVerified) {
      return res.status(400).json({ 
        message: 'Email verification is required. Please verify your email with OTP first.',
        requiresOTP: true
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (['receptionist', 'clinic'].includes(existingUser.role) && existingUser.approvalStatus === 'pending') {
        return res.status(400).json({ 
          message: 'Your registration is already submitted and pending admin approval. Please wait 24–48 hours for confirmation email.',
          pending: true
        });
      }
      if (['receptionist', 'clinic'].includes(existingUser.role) && existingUser.approvalStatus === 'rejected') {
        return res.status(400).json({ 
          message: 'Your previous registration was rejected. Please contact admin at support@healthsyncpro.in for assistance.',
          rejected: true
        });
      }
      if (['receptionist', 'clinic'].includes(existingUser.role) && existingUser.approvalStatus === 'approved') {
        return res.status(400).json({ 
          message: 'An account with this email already exists and is active. Please use the Sign In option instead.',
          alreadyActive: true
        });
      }
      return res.status(400).json({ message: 'This email is already registered. Please use a different email or sign in.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || '',
      role: 'receptionist',
      approvalStatus: 'pending', 
      emailVerified: true, 
      clinicName: clinicName,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date()
    });

    try {
      await user.save();
    } catch (saveError) {
      console.error('Error saving user:', saveError);
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

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json({ 
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.' 
      });
    }
    const { sendOTP } = require('../services/emailService');
    const result = await sendOTP(normalizedEmail, 'password-reset');

    console.log(`✅ Password reset OTP sent to: ${normalizedEmail}`);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
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
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email' 
      });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
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

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, OTP, and new password are required' 
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }
    const { verifyOTP } = require('../services/emailService');
    const otpVerification = verifyOTP(normalizedEmail, otp, 'password-reset');
    if (!otpVerification.success) {
      return res.status(400).json({ 
        success: false,
        message: otpVerification.message 
      });
    }
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`🔐 Resetting password for user: ${normalizedEmail}`);
    console.log(`🔐 New password hash: ${hashedPassword.substring(0, 20)}...`);
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

router.post('/doctor/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const aiSecurityService = require('../services/aiSecurityService');
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const doctorCheck = await Doctor.findOne({ email: normalizedEmail })
      .populate('clinicId', 'name address city phone');
    if (doctorCheck && doctorCheck.isActive === false) {
      console.log(`🚫 Doctor login blocked: Account suspended - ${normalizedEmail}`);
      return res.status(403).json({ 
        message: 'Your account has been suspended',
        reason: doctorCheck.suspendReason || 'Contact admin for more information',
        suspended: true
      });
    }
    const doctor = doctorCheck && doctorCheck.isActive ? doctorCheck : null;

    if (!doctor) {
      await aiSecurityService.trackFailedLogin(normalizedEmail, ipAddress, userAgent);
      return res.status(400).json({ message: 'Invalid credentials or doctor not found' });
    }
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
    if (!doctor.password) {
      return res.status(400).json({ 
        message: 'Please set up your password first',
        needsPasswordSetup: true,
        doctorEmail: doctor.email
      });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      await aiSecurityService.trackFailedLogin(normalizedEmail, ipAddress, userAgent);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    doctor.lastLogin = new Date();
    await doctor.save();
    const token = jwt.sign(
      { doctorId: doctor._id, role: 'doctor', clinicId: doctor.clinicId || null },
      process.env.JWT_SECRET,
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
router.post('/doctor/setup-password', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found with this email' });
    }

    if (doctor.password) {
      return res.status(400).json({ message: 'Password already set. Please use login or reset password.' });
    }
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
router.post('/doctor/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const doctor = await Doctor.findOne({ email: normalizedEmail });

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
router.post('/doctor/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const doctor = await Doctor.findOne({ email: normalizedEmail });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'No doctor account found with this email' });
    }
    const { sendOTP } = require('../services/emailService');
    const result = await sendOTP(normalizedEmail, 'doctor-password-reset');

    console.log(`✅ Doctor password reset OTP sent to: ${normalizedEmail}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email'
    });

  } catch (error) {
    console.error('❌ Doctor forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
});
router.post('/doctor/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { verifyOTP } = require('../services/emailService');
    const verification = verifyOTP(normalizedEmail, otp, 'doctor-password-reset');

    if (!verification.success) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    console.log(`✅ Doctor reset OTP verified for: ${normalizedEmail}`);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('❌ Doctor verify reset OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
});

router.post('/google-signin', async (req, res) => {
  try {
    const { idToken } = req.body;
    const googleClientId = process.env.GOOGLE_SIGNIN_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }
    if (!googleClientId) {
      console.error('Google sign-in is not configured: GOOGLE_SIGNIN_CLIENT_ID is missing.');
      return res.status(503).json({ message: 'Google sign-in is temporarily unavailable' });
    }

    let googleProfile;
    try {
      const ticket = await new OAuth2Client(googleClientId).verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      googleProfile = ticket.getPayload();
    } catch (error) {
      console.warn('Google ID token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid or expired Google sign-in token' });
    }

    if (!googleProfile?.email || !googleProfile.email_verified || !googleProfile.sub) {
      return res.status(401).json({ message: 'Google account email must be verified' });
    }

    const normalizedEmail = googleProfile.email.toLowerCase().trim();
    const googleId = googleProfile.sub;
    const name = googleProfile.name || normalizedEmail.split('@')[0];
    const profilePhoto = googleProfile.picture || null;
    let isNewUser = false;

    let user = await User.findOne({ googleId }) || await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        return res.status(409).json({ message: 'This email is already linked to another Google account' });
      }
      if (!user.googleId) user.googleId = googleId;
      if (profilePhoto && !user.profilePhoto) {
        user.profilePhoto = profilePhoto;
      }
      await user.save();
    } else {
      isNewUser = true;
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
      try {
        const loyalty = new LoyaltyPoints({ userId: user._id });
        loyalty.addPoints(100, 'earned', 'Welcome bonus: 100 points for signing up with Google!', user._id);
        await loyalty.save();
        console.log(`🎁 Awarded 100 signup bonus points to new Google user ${user._id}`);
      } catch (loyaltyError) {
        console.error('Error creating loyalty account:', loyaltyError);
      }
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, clinicId: user.clinicId || null },
      process.env.JWT_SECRET,
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
        clinicId: user.clinicId || null,
        locationCaptured: user.locationCaptured || false
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.post('/doctor/google-signin', async (req, res) => {
  try {
    const { email, name, googleId, profilePhoto } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Email and Google ID are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let doctor = await Doctor.findOne({ email: normalizedEmail });

    if (doctor) {
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
      if (!doctor.googleId) {
        doctor.googleId = googleId;
      }
      if (profilePhoto && !doctor.profilePhoto) {
        doctor.profilePhoto = profilePhoto;
      }
      doctor.lastLogin = new Date();
      await doctor.save();
      const token = jwt.sign(
        { doctorId: doctor._id, role: 'doctor', clinicId: doctor.clinicId || null },
        process.env.JWT_SECRET,
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
router.post('/clinic/google-signin', async (req, res) => {
  try {
    const { email, name, googleId, profilePhoto } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Email and Google ID are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail, role: { $in: ['receptionist', 'clinic'] } });

    if (user) {
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
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (profilePhoto && !user.profilePhoto) {
        user.profilePhoto = profilePhoto;
      }
      await user.save();
      const token = jwt.sign(
        { userId: user._id, role: user.role, clinicId: user.clinicId || null },
        process.env.JWT_SECRET,
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
          profilePhoto: user.profilePhoto,
          emrPlan: user.emrPlan || 'basic'
        }
      });
    } else {
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

router.post('/facebook-signin', async (req, res) => {
  try {
    const { email, name, facebookId, profilePhoto, accessToken } = req.body;

    if (!email || !facebookId) {
      return res.status(400).json({ message: 'Email and Facebook ID are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail, role: 'patient' });
    let isNewUser = false;

    if (user) {
      if (!user.facebookId) {
        user.facebookId = facebookId;
      }
      if (profilePhoto && !user.profilePhoto) {
        user.profilePhoto = profilePhoto;
      }
      await user.save();
    } else {
      isNewUser = true;
      user = new User({
        name: name || 'Facebook User',
        email: normalizedEmail,
        facebookId: facebookId,
        profilePhoto: profilePhoto,
        role: 'patient',
        password: await bcrypt.hash(facebookId + Date.now(), 10), 
        isVerified: true
      });
      await user.save();
      try {
        const loyalty = new LoyaltyPoints({ userId: user._id });
        loyalty.addPoints(100, 'earned', 'Welcome bonus: 100 points for signing up!', user._id);
        await loyalty.save();
      } catch (loyaltyError) {
        console.error('Error creating loyalty account:', loyaltyError);
      }
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, clinicId: user.clinicId || null },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ Facebook sign-in successful for: ${normalizedEmail} (${isNewUser ? 'new user' : 'existing user'})`);

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
        clinicId: user.clinicId || null
      }
    });
  } catch (error) {
    console.error('Facebook sign-in error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/apple-signin', async (req, res) => {
  try {
    const { email, name, appleId, identityToken } = req.body;

    if (!appleId) {
      return res.status(400).json({ message: 'Apple ID is required' });
    }
    let user = await User.findOne({ appleId: appleId, role: 'patient' });
    let isNewUser = false;

    if (user) {
      if (name && !user.name) {
        user.name = name;
      }
      await user.save();
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim(), role: 'patient' });
      
      if (user) {
        user.appleId = appleId;
        if (name && !user.name) {
          user.name = name;
        }
        await user.save();
      } else {
        isNewUser = true;
        user = new User({
          name: name || 'Apple User',
          email: email.toLowerCase().trim(),
          appleId: appleId,
          role: 'patient',
          password: await bcrypt.hash(appleId + Date.now(), 10),
          isVerified: true
        });
        await user.save();
        try {
          const loyalty = new LoyaltyPoints({ userId: user._id });
          loyalty.addPoints(100, 'earned', 'Welcome bonus: 100 points for signing up!', user._id);
          await loyalty.save();
        } catch (loyaltyError) {
          console.error('Error creating loyalty account:', loyaltyError);
        }
      }
    } else {
      return res.status(400).json({ 
        message: 'Email is required for first-time Apple Sign-In. Please allow email access in Apple Sign-In settings.' 
      });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, clinicId: user.clinicId || null },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ Apple sign-in successful for: ${user.email} (${isNewUser ? 'new user' : 'existing user'})`);

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
        clinicId: user.clinicId || null
      }
    });
  } catch (error) {
    console.error('Apple sign-in error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    console.log('📧 Testing email service...');
    console.log(`   Target email: ${email}`);
    console.log(`   EMAIL_USER configured: ${process.env.EMAIL_USER ? 'YES' : 'NO'}`);
    console.log(`   EMAIL_PASS configured: ${process.env.EMAIL_PASS ? 'YES' : 'NO'}`);
    
    const { sendTestEmail } = require('../services/emailService');
    await sendTestEmail(email);
    
    res.json({ 
      success: true, 
      message: `Test email sent to ${email}. Check your inbox!`,
      config: {
        emailUserConfigured: !!process.env.EMAIL_USER,
        emailPassConfigured: !!process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.message,
      config: {
        emailUserConfigured: !!process.env.EMAIL_USER,
        emailPassConfigured: !!process.env.EMAIL_PASS
      }
    });
  }
});
router.get('/config-status', async (req, res) => {
  try {
    const { getGoogleStatus } = require('../services/googleMeetService');
    const googleStatus = getGoogleStatus();
    
    res.json({
      email: {
        configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '***' : 'NOT SET'
      },
      googleMeet: googleStatus,
      frontendUrl: process.env.FRONTEND_URL || 'NOT SET'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post('/create-test-user', async (req, res) => {
  try {
    const { secretKey } = req.body;
    if (secretKey !== 'razorpay-verification-2024') {
      return res.status(403).json({ success: false, message: 'Invalid secret key' });
    }
    
    const bcrypt = require('bcryptjs');
    const TEST_USER = {
      name: 'Razorpay Test User',
      email: 'testuser@healthsync.com',
      password: 'Test@123456',
      phone: '+91-9999999999',
      role: 'patient',
      isVerified: true,
      address: {
        street: '123 Test Street',
        city: 'Bankura',
        state: 'West Bengal',
        pincode: '722101',
        country: 'India'
      },
      dateOfBirth: new Date('1990-01-15'),
      gender: 'male',
      bloodGroup: 'O+',
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+91-8888888888',
        relationship: 'Family'
      }
    };
    const existingUser = await User.findOne({ email: TEST_USER.email });
    
    if (existingUser) {
      return res.json({
        success: true,
        message: 'Test user already exists',
        credentials: {
          email: 'testuser@healthsync.com',
          password: 'Test@123456'
        }
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_USER.password, salt);
    const testUser = new User({
      ...TEST_USER,
      password: hashedPassword
    });
    
    await testUser.save();
    
    console.log('✅ Test user created for Razorpay verification');
    
    res.json({
      success: true,
      message: 'Test user created successfully',
      credentials: {
        email: 'testuser@healthsync.com',
        password: 'Test@123456'
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

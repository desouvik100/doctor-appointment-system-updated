const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../services/emailService');


// ===============================
// CHECK EMAIL CONFIG ROUTE (for debugging)
// ===============================
router.get('/check-config', (req, res) => {
  const config = {
    emailUser: process.env.EMAIL_USER ? 'configured' : 'missing',
    emailPass: process.env.EMAIL_PASS ? 'configured' : 'missing',
    nodeEnv: process.env.NODE_ENV || 'not set'
  };
  
  console.log('📧 Email config check:', config);
  
  res.json({
    success: true,
    config: config,
    message: 'Configuration check complete'
  });
});

// ===============================
// SEND OTP ROUTE
// ===============================
router.post('/send-otp', async (req, res) => {

  try {
    const { email, type } = req.body;
    
    // Normalize email
    const cleanEmail = email?.toLowerCase().trim();
    const otpType = type || 'register';

    console.log('═══════════════════════════════════════');
    console.log('📧 SEND OTP REQUEST');
    console.log('Email (raw):', email);
    console.log('Email (clean):', cleanEmail);
    console.log('Type:', otpType);
    console.log('═══════════════════════════════════════');

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    const isPhone = /^\+?[0-9]{10,15}$/.test(cleanEmail);
    if (!isEmail && !isPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or phone format"
      });
    }

    // For staff registration OTP: check if account already exists and give helpful messages
    // Wrapped in try/catch with timeout — never block OTP sending if DB is slow
    if (otpType === 'staff-registration') {
      try {
        const existingUser = await Promise.race([
          User.findOne({ email: cleanEmail }).lean(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 3000))
        ]);
        if (existingUser) {
          if (['receptionist', 'clinic'].includes(existingUser.role)) {
            if (existingUser.approvalStatus === 'pending') {
              return res.status(400).json({
                success: false,
                message: 'Your registration is already submitted and pending admin approval. Please wait 24–48 hours for a confirmation email. No need to register again.',
                pending: true
              });
            }
            if (existingUser.approvalStatus === 'approved') {
              return res.status(400).json({
                success: false,
                message: 'A staff account with this email already exists and is active. Please use the Sign In option.',
                alreadyActive: true
              });
            }
            if (existingUser.approvalStatus === 'rejected') {
              return res.status(400).json({
                success: false,
                message: 'Your previous registration was rejected. Please contact admin at support@healthsyncpro.in.',
                rejected: true
              });
            }
          }
          // Email used by a patient or other account type
          return res.status(400).json({
            success: false,
            message: 'This email is already registered under a different account type. Please use a different email address.',
          });
        }
      } catch (dbErr) {
        // DB check failed or timed out — log and proceed with OTP sending
        console.warn('⚠️ DB duplicate check skipped:', dbErr.message);
      }
    }

    const result = await sendOTP(cleanEmail, otpType);

    console.log('📧 OTP send result for', cleanEmail, ':', result);

    // Always return success with OTP - email or SMS may or may not have been sent
    const response = {
      success: true,
      message: isPhone
        ? "Verification code generated. Please check your SMS. If you don't receive it, use the code shown below."
        : "Verification code generated. Please check your email. If you don't receive it, use the code shown below.",
      // Return OTP for cases where SMS/email doesn't work
      otp: result.otp,
      note: isPhone
        ? "If SMS is not received within 2 minutes, you can use this OTP directly"
        : "If email is not received within 2 minutes, you can use this OTP directly"
    };

    return res.status(200).json(response);

  } 
  catch (error) {
    console.error("❌ Send OTP error:", error.message);
    console.error("❌ Full error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again or contact support.",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Email service error'
    });
  }

});


// ===============================
// VERIFY OTP ROUTE
// ===============================
router.post('/verify-otp', async (req, res) => {

  try {
    const { email, otp, type } = req.body;
    
    // Normalize email and use provided type or default
    const cleanEmail = email?.toLowerCase().trim();
    const otpType = type || 'register';

    console.log('═══════════════════════════════════════');
    console.log('🔍 VERIFY OTP REQUEST');
    console.log('Email (raw):', email);
    console.log('Email (clean):', cleanEmail);
    console.log('OTP:', otp);
    console.log('Type:', otpType);
    console.log('═══════════════════════════════════════');

    if (!cleanEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    // Clean the OTP - remove any spaces
    const cleanOtp = otp.toString().trim().replace(/\s/g, '');
    
    if (!/^\d{6}$/.test(cleanOtp)) {
      console.log('❌ OTP format invalid:', cleanOtp);
      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits"
      });
    }

    const result = verifyOTP(cleanEmail, cleanOtp, otpType);

    if (result.success) {
      return res.status(200).json({
        success: true,
        verified: true,
        message: result.message
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        message: result.message
      });
    }

  } 
  catch (error) {
    console.error("❌ Verify OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message
    });
  }

});
module.exports = router;
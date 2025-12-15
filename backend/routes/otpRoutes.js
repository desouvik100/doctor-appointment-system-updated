const express = require('express');
const router = express.Router();

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const result = await sendOTP(cleanEmail, otpType);

    console.log('📧 OTP send result for', cleanEmail, ':', result);

    // Return OTP for testing (temporarily enabled for debugging)
    const response = {
      success: true,
      message: "OTP sent successfully to your email",
      // Temporarily return OTP for debugging - REMOVE IN PRODUCTION
      otp: result.otp,
      debugNote: "OTP shown for debugging - check server logs if email not received"
    };

    return res.status(200).json(response);

  } 
  catch (error) {
    console.error("❌ Send OTP error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message
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
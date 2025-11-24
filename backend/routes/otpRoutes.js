const express = require('express');
const router = express.Router();

const { sendOTP, verifyOTP } = require('../services/emailService');


// ===============================
// SEND OTP ROUTE
// ===============================
router.post('/send-otp', async (req, res) => {

  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const result = await sendOTP(email, type);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email"
    });

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

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits"
      });
    }

    const result = verifyOTP(email, otp, type);

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
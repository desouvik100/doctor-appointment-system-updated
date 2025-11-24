const nodemailer = require('nodemailer');

// Store OTP temporarily in memory
const otpStore = new Map();

// ===============================
// CREATE TRANSPORTER
// ===============================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Check if email server is ready
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transport error:', error.message);
  } else {
    console.log('✅ Email server is ready to send mails');
  }
});

// ===============================
// GENERATE OTP
// ===============================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===============================
// SEND OTP
// ===============================
async function sendOTP(email, type = "register") {

  console.log('🔧 Checking email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'configured' : 'missing');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'configured' : 'missing');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const error = new Error("Email configuration missing. Please check EMAIL_USER and EMAIL_PASS environment variables.");
    console.error('❌ Email config error:', error.message);
    throw error;
  }

  const otp = generateOTP();
  const key = `${email}|${type}`;

  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
  });

  const mailOptions = {
    from: `"Doctor Appointment System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}`,
    html: `
      <h2>Doctor Appointment System</h2>
      <p>Your OTP code is:</p>
      <h1>${otp}</h1>
      <p>It is valid for 10 minutes</p>
      <p>If you didn’t request this, ignore this email.</p>
    `
  };

  try {
    console.log('📤 Attempting to send OTP email to:', email);
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent successfully:", result.messageId);

    return {
      success: true,
      message: "OTP sent successfully"
    };

  } catch (error) {
    console.error("❌ Error sending OTP:", error.message);
    console.error("❌ Error details:", error);
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      throw new Error("Email authentication failed. Please check your Gmail app password.");
    } else if (error.code === 'ECONNECTION') {
      throw new Error("Cannot connect to email server. Please check your internet connection.");
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}


// ===============================
// VERIFY OTP
// ===============================
function verifyOTP(email, otp, type = "register") {

  const key = `${email}|${type}`;
  const data = otpStore.get(key);

  if (!data) {
    return {
      success: false,
      message: "OTP not found. Please request again."
    };
  }

  if (Date.now() > data.expiresAt) {
    otpStore.delete(key);
    return {
      success: false,
      message: "OTP expired. Please request again."
    };
  }

  if (otp !== data.otp) {
    return {
      success: false,
      message: "Invalid OTP entered."
    };
  }

  otpStore.delete(key);

  return {
    success: true,
    message: "OTP verified successfully"
  };
}


module.exports = {
  sendOTP,
  verifyOTP
};
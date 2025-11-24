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

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS not found in .env file");
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
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent:", result.messageId);

    return {
      success: true,
      message: "OTP sent successfully"
    };

  } catch (error) {
    console.error("❌ Error sending OTP:", error.message);
    throw error;
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
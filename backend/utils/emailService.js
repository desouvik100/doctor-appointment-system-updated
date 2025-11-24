const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// optional: verify on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transport error:', error.message);
  } else {
    console.log('✅ Email transport ready');
  }
});

// generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: `"Doctor Appointment System" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
    html: `<p>Your OTP code is: <b>${otp}</b></p><p>It will expire in 10 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { generateOtp, sendOtpEmail };
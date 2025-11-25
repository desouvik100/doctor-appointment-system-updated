// backend/services/emailService.js
const { Resend } = require('resend');

// In-memory OTP store: { "email|type" : { otp, expiresAt } }
const otpStore = new Map();

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---- Resend client ----
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

// Small helper to send any email via Resend
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment');
  }
  if (!FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL is not set in environment');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    console.log('Resend data:', data);
    console.log('Resend error:', error);

    if (error) {
      console.error('❌ Resend email error:', error);
      throw new Error(error.message || 'Resend email error');
    }

    console.log('✅ Resend email sent, id:', data?.id);
    return data;
  } catch (err) {
    console.error('❌ Resend email exception:', err);
    throw err;
  }
}

// ---- PUBLIC: send OTP ----
async function sendOTP(email, type = 'register') {
  if (!email) {
    throw new Error('Email is required for OTP');
  }

  console.log('🔔 sendOTP called for:', email, 'type:', type);

  const otp = generateOTP();
  const key = `${email}|${type}`;
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(key, { otp, expiresAt });

  console.log('Generated OTP:', otp, 'for key:', key);

  const subject = 'Your OTP Code';
  const text = `Your OTP code is: ${otp}. It is valid for 10 minutes.`;
  const html = `
    <h2>Doctor Appointment System</h2>
    <p>Your OTP code is:</p>
    <h1>${otp}</h1>
    <p>This code is valid for <b>10 minutes</b>.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  await sendEmail({ to: email, subject, html, text });

  return {
    success: true,
    message: 'OTP sent successfully',
  };
}

// ---- PUBLIC: verify OTP ----
function verifyOTP(email, otp, type = 'register') {
  const key = `${email}|${type}`;
  const record = otpStore.get(key);

  if (!record) {
    return {
      success: false,
      message: 'No OTP found for this email. Please request a new one.',
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return {
      success: false,
      message: 'OTP has expired. Please request a new one.',
    };
  }

  if (record.otp !== otp) {
    return {
      success: false,
      message: 'Invalid OTP. Please try again.',
    };
  }

  // OTP is valid; remove it so it cannot be reused
  otpStore.delete(key);

  return {
    success: true,
    message: 'OTP verified successfully.',
  };
}

// ---- Optional: test email helper ----
async function sendTestEmail(to) {
  const subject = 'Test email from Doctor Appointment System (Resend)';
  const text = 'If you see this, Resend is working from Render 👍';
  const html = `<p>${text}</p>`;
  await sendEmail({ to, subject, html, text });
  return { success: true };
}

module.exports = {
  sendOTP,
  verifyOTP,
  sendTestEmail,
};
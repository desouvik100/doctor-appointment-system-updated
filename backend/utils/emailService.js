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

async function sendOtpEmail(to, otp, type = 'register') {
  // Determine subject and message based on type
  let subject, purpose, actionText;
  
  if (type === 'register' || type === 'registration') {
    subject = 'HealthSync - Verify Your Registration';
    purpose = 'You are receiving this email because you requested to create a new account on HealthSync.';
    actionText = 'Complete your registration by entering this verification code:';
  } else if (type === 'reset' || type === 'password-reset') {
    subject = 'HealthSync - Password Reset Request';
    purpose = 'You are receiving this email because you requested to reset your password on HealthSync.';
    actionText = 'Reset your password by entering this verification code:';
  } else {
    subject = 'HealthSync - Verification Code';
    purpose = 'You are receiving this verification code from HealthSync.';
    actionText = 'Enter this verification code to continue:';
  }

  const mailOptions = {
    from: `"HealthSync Healthcare" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: `${purpose}\n\nYour verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nHealthSync - Your Healthcare Management Platform\nWebsite: https://healthsync.com\nSupport: support@healthsync.com\nPhone: +1 (555) 123-4567`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f0f2f5; margin: 0; padding: 0; }
          .email-wrapper { width: 100%; background-color: #f0f2f5; padding: 20px 0; }
          .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
          .top-bar { background: #ffffff; padding: 12px 30px; border-bottom: 1px solid #e5e7eb; }
          .top-bar-text { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
          .logo { width: 80px; height: 80px; background: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 15px; }
          .company-name { color: white; font-size: 32px; font-weight: 700; margin: 10px 0 5px 0; }
          .tagline { color: rgba(255,255,255,0.95); font-size: 15px; }
          .profile-section { background: linear-gradient(to bottom, #667eea 0%, transparent 100%); padding: 0 30px 30px 30px; text-align: center; }
          .profile-card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-top: -20px; }
          .greeting { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
          .content { padding: 30px; }
          .content-header { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; }
          .content-text { font-size: 14px; color: #4b5563; margin-bottom: 15px; }
          .otp-container { margin: 30px 0; }
          .otp-label { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 12px; }
          .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; text-align: center; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3); }
          .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: white; font-family: 'Courier New', monospace; }
          .info-box { background: #f9fafb; border-left: 4px solid #667eea; padding: 16px 20px; margin: 20px 0; border-radius: 6px; }
          .info-box-title { font-weight: 600; color: #667eea; font-size: 14px; margin-bottom: 5px; }
          .info-box-text { font-size: 13px; color: #4b5563; }
          .warning-box { background: #fffbeb; border: 1px solid #fbbf24; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 6px; }
          .warning-box-title { font-weight: 600; color: #92400e; font-size: 14px; margin-bottom: 5px; }
          .warning-box-text { font-size: 13px; color: #78350f; }
          .features { background: #f9fafb; padding: 25px 30px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .support-section { background: #f9fafb; padding: 25px 30px; text-align: center; }
          .support-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; }
          .support-item { margin: 10px 0; font-size: 13px; color: #4b5563; }
          .social-section { padding: 25px 30px; text-align: center; }
          .social-title { font-size: 14px; color: #6b7280; margin-bottom: 15px; }
          .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }
          .footer-logo { font-size: 24px; font-weight: 700; color: white; margin-bottom: 10px; }
          .footer-text { font-size: 13px; margin: 8px 0; }
          .footer-bottom { font-size: 11px; color: #6b7280; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="top-bar">
              <div class="top-bar-text">Secure Email • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
            <div class="header">
              <div class="logo">🏥</div>
              <h1 class="company-name">HealthSync</h1>
              <p class="tagline">Your Healthcare Management Platform</p>
            </div>
            <div class="profile-section">
              <div class="profile-card">
                <div class="greeting">Hello! 👋</div>
                <div style="font-size: 14px; color: #6b7280;">We received a request for verification</div>
              </div>
            </div>
            <div class="content">
              <div class="content-header">${actionText}</div>
              <div class="content-text">${purpose}</div>
              <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
              </div>
              <div class="info-box">
                <div class="info-box-title">⏱️ Valid for 10 Minutes</div>
                <div class="info-box-text">This code will expire after 10 minutes for your security.</div>
              </div>
              <div class="warning-box">
                <div class="warning-box-title">🔒 Security Notice</div>
                <div class="warning-box-text">If you did not request this code, please ignore this email. Never share this code with anyone.</div>
              </div>
            </div>
            <div class="features">
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">Why Choose HealthSync?</div>
              <div style="font-size: 13px; color: #4b5563;">🔐 Bank-Level Security • ⚡ Instant Access • 👨‍⚕️ Expert Doctors • 📱 24/7 Support</div>
            </div>
            <div class="support-section">
              <div class="support-title">Need Help? We're Here for You</div>
              <div class="support-item">📧 support@healthsync.com</div>
              <div class="support-item">📞 +1 (555) 123-4567</div>
              <div class="support-item">🌐 healthsync.com</div>
            </div>
            <div class="social-section">
              <div class="social-title">Connect With Us</div>
              <div style="font-size: 13px; color: #6b7280;">Facebook • Twitter • Instagram • LinkedIn</div>
            </div>
            <div class="footer">
              <div class="footer-logo">HealthSync</div>
              <div class="footer-text">Your trusted healthcare management platform</div>
              <div class="footer-text">Providing quality healthcare services since 2020</div>
              <div class="footer-bottom">
                <p>© ${new Date().getFullYear()} HealthSync. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { generateOtp, sendOtpEmail };
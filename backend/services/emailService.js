// backend/services/emailService.js
const nodemailer = require('nodemailer');

// In-memory OTP store: { "email|type" : { otp, expiresAt } }
const otpStore = new Map();

// Track email service status
let emailServiceReady = false;
let useResend = false;

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---- Nodemailer transporter with better config for cloud platforms ----
let transporter = null;

function initializeTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Better settings for cloud platforms
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5,
    // Timeout settings
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

// Initialize transporter
transporter = initializeTransporter();

// Test transporter connection (non-blocking)
if (transporter) {
  transporter.verify()
    .then(() => {
      console.log('✅ Email transporter ready');
      emailServiceReady = true;
    })
    .catch((error) => {
      console.warn('⚠️ Gmail SMTP unavailable:', error.message);
      console.log('📧 Will use Resend API as fallback if configured');
      emailServiceReady = false;
      
      // Check if Resend is available
      if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your_')) {
        useResend = true;
        console.log('✅ Resend API configured as email fallback');
      }
    });
} else {
  console.warn('⚠️ Email transporter not initialized');
}

// Send email via Resend API
async function sendViaResend({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('your_')) {
    throw new Error('Resend API not configured');
  }

  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'HealthSync <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject: subject,
    html: html,
    text: text
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, messageId: data.id, provider: 'resend' };
}

// List of fake/test domains that should not receive real emails
const FAKE_EMAIL_DOMAINS = [
  'healthsync.com',
  'example.com',
  'test.com',
  'fake.com',
  'demo.com',
  'sample.com',
  'localhost',
  'mailinator.com'
];

// Check if email is a fake/test email
function isFakeEmail(email) {
  if (!email) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  return FAKE_EMAIL_DOMAINS.some(fakeDomain => domain === fakeDomain || domain?.endsWith('.' + fakeDomain));
}

// Small helper to send any email via Nodemailer or Resend
async function sendEmail({ to, subject, html, text }) {
  // Skip sending to fake/test email addresses
  if (isFakeEmail(to)) {
    console.log('📧 Skipping email to fake/test address:', to);
    console.log('📧 Subject:', subject);
    return { success: true, message: 'Skipped - fake/test email address', skipped: true };
  }

  // Check if any email service is configured
  const hasGmail = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  const hasResend = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your_');

  if (!hasGmail && !hasResend) {
    console.warn('⚠️ No email service configured. Email will not be sent.');
    console.log('📧 Email would have been sent to:', to);
    console.log('📧 Subject:', subject);
    return { success: true, message: 'Email service not configured (development mode)' };
  }

  // Try Resend first if Gmail is not working
  if (useResend || !emailServiceReady) {
    if (hasResend) {
      try {
        const result = await sendViaResend({ to, subject, html, text });
        console.log('✅ Email sent via Resend');
        console.log('📧 To:', to);
        return result;
      } catch (resendError) {
        console.error('❌ Resend error:', resendError.message);
        // Fall through to try Gmail
      }
    }
  }

  // Try Gmail/Nodemailer
  if (hasGmail && transporter) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        text
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent via Gmail');
      console.log('📧 Message ID:', info.messageId);
      console.log('📧 To:', to);
      return { success: true, messageId: info.messageId, provider: 'gmail' };
    } catch (gmailError) {
      console.error('❌ Gmail error:', gmailError.message);
      
      // Try Resend as last resort
      if (hasResend) {
        try {
          const result = await sendViaResend({ to, subject, html, text });
          console.log('✅ Email sent via Resend (fallback)');
          return result;
        } catch (resendError) {
          console.error('❌ Resend fallback also failed:', resendError.message);
        }
      }
      
      throw gmailError;
    }
  }

  // If we get here, no email was sent
  console.warn('⚠️ Could not send email - no working email service');
  return { success: false, message: 'No email service available' };
}

// ---- PUBLIC: send OTP ----
async function sendOTP(email, type = 'register') {
  if (!email) {
    throw new Error('Email is required for OTP');
  }

  console.log('🔔 sendOTP called for:', email, 'type:', type);

  // Generate OTP FIRST before sending email
  const otp = generateOTP();
  const key = `${email}|${type}`;
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store OTP immediately
  otpStore.set(key, { otp, expiresAt });

  console.log('═══════════════════════════════════════');
  console.log('🔐 OTP GENERATED');
  console.log('Email:', email);
  console.log('Type:', type);
  console.log('OTP CODE:', otp);
  console.log('Valid for: 10 minutes');
  console.log('═══════════════════════════════════════');

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

  const text = `${purpose}\n\nYour verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this email or contact support if you have concerns.\n\nHealthSync - Your Healthcare Management Platform\nWebsite: https://healthsync.com\nSupport: support@healthsync.com\nPhone: +1 (555) 123-4567`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${subject}</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f0f2f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .email-wrapper { width: 100%; background-color: #f0f2f5; padding: 20px 0; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        
        /* Top Bar */
        .top-bar { background: #ffffff; padding: 12px 30px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .top-bar-text { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* Header with Logo */
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; position: relative; }
        .logo-container { margin-bottom: 15px; }
        .logo { width: 80px; height: 80px; background: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .company-name { color: white; font-size: 32px; font-weight: 700; margin: 10px 0 5px 0; letter-spacing: -0.5px; }
        .tagline { color: rgba(255,255,255,0.95); font-size: 15px; font-weight: 400; margin: 0; }
        
        /* Profile Section */
        .profile-section { background: linear-gradient(to bottom, #667eea 0%, transparent 100%); padding: 0 30px 30px 30px; text-align: center; }
        .profile-card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-top: -20px; }
        .greeting { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
        .greeting-subtitle { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
        
        /* Content */
        .content { padding: 30px; }
        .content-header { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; line-height: 1.5; }
        .content-text { font-size: 14px; color: #4b5563; margin-bottom: 15px; line-height: 1.7; }
        
        /* OTP Box */
        .otp-container { margin: 30px 0; }
        .otp-label { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 12px; }
        .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; text-align: center; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3); }
        .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: white; font-family: 'Courier New', Consolas, monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.2); user-select: all; }
        
        /* Info Boxes */
        .info-box { background: #f9fafb; border-left: 4px solid #667eea; padding: 16px 20px; margin: 20px 0; border-radius: 6px; }
        .info-box-title { font-weight: 600; color: #667eea; font-size: 14px; margin-bottom: 5px; display: flex; align-items: center; }
        .info-box-text { font-size: 13px; color: #4b5563; line-height: 1.6; margin: 0; }
        
        .warning-box { background: #fffbeb; border: 1px solid #fbbf24; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 6px; }
        .warning-box-title { font-weight: 600; color: #92400e; font-size: 14px; margin-bottom: 5px; display: flex; align-items: center; }
        .warning-box-text { font-size: 13px; color: #78350f; line-height: 1.6; margin: 0; }
        
        /* Features Section */
        .features { background: #f9fafb; padding: 25px 30px; margin: 20px 0; border-radius: 8px; }
        .features-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; text-align: center; }
        .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .feature-item { text-align: center; padding: 15px; background: white; border-radius: 8px; }
        .feature-icon { font-size: 28px; margin-bottom: 8px; }
        .feature-text { font-size: 12px; color: #4b5563; font-weight: 500; }
        
        /* Support Section */
        .support-section { background: #f9fafb; padding: 25px 30px; text-align: center; }
        .support-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; }
        .support-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
        .support-item { text-align: center; }
        .support-icon { font-size: 24px; margin-bottom: 5px; }
        .support-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .support-value { font-size: 13px; color: #1f2937; font-weight: 500; word-break: break-all; }
        
        /* Social Media */
        .social-section { padding: 25px 30px; text-align: center; background: white; }
        .social-title { font-size: 14px; color: #6b7280; margin-bottom: 15px; }
        .social-links { display: flex; justify-content: center; gap: 15px; }
        .social-link { display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: #f3f4f6; text-decoration: none; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.3s; }
        .social-link:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        
        /* Footer */
        .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }
        .footer-logo { font-size: 24px; font-weight: 700; color: white; margin-bottom: 10px; }
        .footer-text { font-size: 13px; margin: 8px 0; line-height: 1.6; }
        .footer-links { margin: 15px 0; }
        .footer-link { color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 12px; }
        .footer-link:hover { color: #667eea; }
        .footer-divider { height: 1px; background: #374151; margin: 20px 0; }
        .footer-bottom { font-size: 11px; color: #6b7280; }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
          .email-container { border-radius: 0; }
          .content, .header, .profile-section, .support-section, .social-section { padding: 20px !important; }
          .otp-code { font-size: 36px; letter-spacing: 8px; }
          .feature-grid, .support-grid { grid-template-columns: 1fr; }
          .company-name { font-size: 28px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <div class="email-container">
                
                <!-- Top Bar -->
                <div class="top-bar">
                  <div class="top-bar-text">Secure Email</div>
                  <div class="top-bar-text">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                
                <!-- Header -->
                <div class="header">
                  <div class="logo-container">
                    <div class="logo">🏥</div>
                  </div>
                  <h1 class="company-name">HealthSync</h1>
                  <p class="tagline">Your Healthcare Management Platform</p>
                </div>
                
                <!-- Profile Section -->
                <div class="profile-section">
                  <div class="profile-card">
                    <div class="greeting">Hello! 👋</div>
                    <div class="greeting-subtitle">We received a request for verification</div>
                  </div>
                </div>
                
                <!-- Content -->
                <div class="content">
                  <div class="content-header">${actionText}</div>
                  <div class="content-text">${purpose}</div>
                  
                  <!-- OTP Box -->
                  <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-box">
                      <div class="otp-code">${otp}</div>
                    </div>
                  </div>
                  
                  <!-- Validity Info -->
                  <div class="info-box">
                    <div class="info-box-title">⏱️ Valid for 10 Minutes</div>
                    <div class="info-box-text">This verification code will expire after 10 minutes for your security. Please use it promptly to complete your ${type === 'register' || type === 'registration' ? 'registration' : 'password reset'}.</div>
                  </div>
                  
                  <!-- Security Warning -->
                  <div class="warning-box">
                    <div class="warning-box-title">🔒 Security Notice</div>
                    <div class="warning-box-text">If you did not request this verification code, please ignore this email. Your account remains secure. Never share this code with anyone, including HealthSync staff. If you have concerns, please contact our support team immediately.</div>
                  </div>
                </div>
                
                <!-- Features Section -->
                <div class="features">
                  <div class="features-title">Why Choose HealthSync?</div>
                  <div class="feature-grid">
                    <div class="feature-item">
                      <div class="feature-icon">🔐</div>
                      <div class="feature-text">Bank-Level Security</div>
                    </div>
                    <div class="feature-item">
                      <div class="feature-icon">⚡</div>
                      <div class="feature-text">Instant Access</div>
                    </div>
                    <div class="feature-item">
                      <div class="feature-icon">👨‍⚕️</div>
                      <div class="feature-text">Expert Doctors</div>
                    </div>
                    <div class="feature-item">
                      <div class="feature-icon">📱</div>
                      <div class="feature-text">24/7 Support</div>
                    </div>
                  </div>
                </div>
                
                <!-- Support Section -->
                <div class="support-section">
                  <div class="support-title">Need Help? We're Here for You</div>
                  <div class="support-grid">
                    <div class="support-item">
                      <div class="support-icon">📧</div>
                      <div class="support-label">Email</div>
                      <div class="support-value">support@healthsync.com</div>
                    </div>
                    <div class="support-item">
                      <div class="support-icon">📞</div>
                      <div class="support-label">Phone</div>
                      <div class="support-value">+1 (555) 123-4567</div>
                    </div>
                    <div class="support-item">
                      <div class="support-icon">🌐</div>
                      <div class="support-label">Website</div>
                      <div class="support-value">healthsync.com</div>
                    </div>
                  </div>
                </div>
                
                <!-- Social Media -->
                <div class="social-section">
                  <div class="social-title">Connect With Us</div>
                  <div class="social-links">
                    <a href="https://facebook.com/healthsync" class="social-link" style="background: #1877f2; color: white;">📘</a>
                    <a href="https://twitter.com/healthsync" class="social-link" style="background: #1da1f2; color: white;">🐦</a>
                    <a href="https://instagram.com/healthsync" class="social-link" style="background: #e4405f; color: white;">📷</a>
                    <a href="https://linkedin.com/company/healthsync" class="social-link" style="background: #0077b5; color: white;">💼</a>
                  </div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                  <div class="footer-logo">HealthSync</div>
                  <div class="footer-text">Your trusted healthcare management platform</div>
                  <div class="footer-text">Providing quality healthcare services since 2020</div>
                  
                  <div class="footer-links">
                    <a href="https://healthsync.com/about" class="footer-link">About Us</a>
                    <a href="https://healthsync.com/privacy" class="footer-link">Privacy Policy</a>
                    <a href="https://healthsync.com/terms" class="footer-link">Terms of Service</a>
                    <a href="https://healthsync.com/contact" class="footer-link">Contact</a>
                  </div>
                  
                  <div class="footer-divider"></div>
                  
                  <div class="footer-bottom">
                    <p>© ${new Date().getFullYear()} HealthSync. All rights reserved.</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p style="margin-top: 10px;">123 Healthcare Avenue, Medical District, CA 90210, United States</p>
                  </div>
                </div>
                
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  // Try to send email, but don't fail if it doesn't work
  try {
    await sendEmail({ to: email, subject, html, text });
  } catch (emailError) {
    console.warn('⚠️  Email sending failed, but OTP is still valid:', emailError.message);
  }

  return {
    success: true,
    message: 'OTP sent successfully',
    otp: otp,  // Return OTP for development/testing
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
  const subject = 'HealthSync - Email Service Test';
  const text = 'If you see this, the HealthSync email service is working correctly! 👍';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        h1 { margin: 0; font-size: 24px; }
        p { color: #555; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 HealthSync</h1>
        </div>
        <p>✅ <strong>Email Service Test Successful!</strong></p>
        <p>If you're seeing this email, the HealthSync email service is configured correctly and working as expected.</p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">This is an automated test message from HealthSync.</p>
      </div>
    </body>
    </html>
  `;
  await sendEmail({ to, subject, html, text });
  return { success: true };
}

// ---- Send Appointment Confirmation Email with Meet Link ----
async function sendAppointmentEmail(appointment, recipientType = 'patient') {
  try {
    const recipient = recipientType === 'patient' ? appointment.userId : appointment.doctorId;
    const otherParty = recipientType === 'patient' ? appointment.doctorId : appointment.userId;
    
    if (!recipient || !recipient.email) {
      throw new Error(`${recipientType} email not found`);
    }

    // Format date in IST timezone
    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });

    // Use the stored time directly (it's already in IST format like "10:00" or "14:30")
    const appointmentTime = appointment.time || 'Time not set';
    
    // Format time for display (convert 24h to 12h format)
    let displayTime = appointmentTime;
    if (appointmentTime && appointmentTime.includes(':')) {
      const [hours, minutes] = appointmentTime.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      displayTime = `${hour12}:${minutes} ${ampm} IST`;
    }

    const meetLink = appointment.googleMeetLink || appointment.meetingLink;
    const clinicName = appointment.clinicId?.name || 'HealthSync Clinic';
    
    // Debug logging
    console.log('📧 Preparing appointment email:');
    console.log(`   Recipient: ${recipient.email} (${recipientType})`);
    console.log(`   Date: ${formattedDate}`);
    console.log(`   Time: ${displayTime} (stored: ${appointmentTime})`);
    console.log(`   Meet Link: ${meetLink || 'NOT SET'}`);
    console.log(`   Consultation Type: ${appointment.consultationType}`);

    const subject = recipientType === 'patient' 
      ? `Appointment Confirmed - Dr. ${otherParty.name}`
      : `🎥 New Online Consultation - ${otherParty.name} (You are the Host)`;

    const text = `
Your ${appointment.consultationType === 'online' ? 'Online' : 'In-Person'} Appointment Details:

${recipientType === 'patient' ? 'Doctor' : 'Patient'}: ${otherParty.name}
Date: ${formattedDate}
Time: ${displayTime}
Clinic: ${clinicName}
${appointment.consultationType === 'online' && meetLink ? `

🎥 GOOGLE MEET LINK: ${meetLink}

Click the link above to join your online consultation.` : ''}

${appointment.consultationType === 'online' ? 'Join the meeting 5 minutes before your scheduled time.' : 'Please arrive 10 minutes early.'}

Thank you for choosing HealthSync!
    `;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f2f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .content { padding: 30px; }
    .appointment-card { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #4b5563; width: 120px; }
    .detail-value { color: #1f2937; flex: 1; }
    .meet-link-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .meet-link-box h3 { margin-bottom: 10px; font-size: 18px; }
    .meet-button { display: inline-block; background: white; color: #059669; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 10px; }
    .meet-button:hover { background: #f0fdf4; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 HealthSync</h1>
      <p>Appointment Confirmation</p>
    </div>
    
    <div class="content">
      <h2 style="color: #1f2937; margin-bottom: 10px;">
        ${recipientType === 'patient' ? '✅ Your Appointment is Confirmed!' : '📅 New Appointment Scheduled - You are the Meeting Host'}
      </h2>
      <p style="color: #6b7280; margin-bottom: 20px;">
        ${recipientType === 'patient' 
          ? `Your ${appointment.consultationType === 'online' ? 'online consultation' : 'appointment'} with Dr. ${otherParty.name} has been confirmed.`
          : `You have a new ${appointment.consultationType === 'online' ? 'online consultation' : 'appointment'} with ${otherParty.name}. <strong>You are the meeting host/admin</strong> and have full control over the meeting.`
        }
      </p>

      <div class="appointment-card">
        <div class="detail-row">
          <div class="detail-label">${recipientType === 'patient' ? 'Doctor:' : 'Patient:'}</div>
          <div class="detail-value">${otherParty.name}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Date:</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Time:</div>
          <div class="detail-value"><strong style="color: #667eea; font-size: 16px;">${displayTime}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Type:</div>
          <div class="detail-value">${appointment.consultationType === 'online' ? '🌐 Online Consultation' : '🏥 In-Person Visit'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Clinic:</div>
          <div class="detail-value">${clinicName}</div>
        </div>
        ${appointment.reason ? `
        <div class="detail-row">
          <div class="detail-label">Reason:</div>
          <div class="detail-value">${appointment.reason}</div>
        </div>
        ` : ''}
      </div>

      ${appointment.consultationType === 'online' && meetLink ? `
      <div class="meet-link-box" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; border: 3px solid #059669;">
        <h3 style="font-size: 22px; margin-bottom: 15px;">🎥 JOIN YOUR ONLINE CONSULTATION</h3>
        <p style="margin: 10px 0; font-size: 16px;">Your appointment is at <strong>${displayTime}</strong></p>
        <a href="${meetLink}" style="display: inline-block; background: white; color: #059669; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 18px; margin: 15px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
          🚀 JOIN MEETING NOW
        </a>
        <p style="margin-top: 20px; font-size: 14px; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
          <strong>Meeting Link:</strong><br>
          <a href="${meetLink}" style="color: white; word-break: break-all; font-size: 13px;">${meetLink}</a>
        </p>
      </div>
      ` : ''}
      
      ${appointment.consultationType === 'online' && !meetLink ? `
      <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h3 style="color: #92400e; margin-bottom: 10px;">⚠️ Meeting Link Not Available Yet</h3>
        <p style="color: #78350f; font-size: 14px;">The Google Meet link will be sent to you shortly. Please check your email again in a few minutes.</p>
      </div>
      ` : ''}

      <div class="info-box">
        <strong>📌 Important:</strong><br>
        ${appointment.consultationType === 'online' 
          ? (recipientType === 'doctor' 
              ? '<strong>As the meeting host, you have full admin controls:</strong><br>• Admit/remove participants<br>• Mute/unmute participants<br>• Share your screen<br>• Record the consultation if needed<br><br>Please join the meeting a few minutes early to prepare.'
              : 'Please join the meeting 5 minutes before your scheduled time. Make sure you have a stable internet connection and your camera/microphone are working.')
          : (recipientType === 'doctor'
              ? 'A new patient appointment has been scheduled. Please review the patient details before the appointment.'
              : 'Please arrive at the clinic 10 minutes before your scheduled time. Bring any relevant medical documents or prescriptions.')
        }
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        If you need to reschedule or cancel, please contact us at least 24 hours in advance.
      </p>
    </div>

    <div class="footer">
      <p><strong>HealthSync</strong> - Your Healthcare Management Platform</p>
      <p style="margin-top: 10px;">
        📧 support@healthsync.com | 📞 +1 (555) 123-4567
      </p>
      <p style="margin-top: 10px; font-size: 11px; color: #6b7280;">
        © ${new Date().getFullYear()} HealthSync. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: recipient.email,
      subject,
      html,
      text
    });

    console.log(`✅ Appointment email sent to ${recipientType}: ${recipient.email}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Error sending appointment email:`, error);
    throw error;
  }
}

// Send queue position notification email
async function sendQueueNotificationEmail(patientEmail, patientName, doctorName, queuePosition, estimatedTime, appointmentTime) {
  // Dynamic subject based on position
  const isUrgent = queuePosition <= 2;
  const subject = isUrgent 
    ? `🚨 URGENT: Only ${queuePosition} patient(s) before you! - Dr. ${doctorName}`
    : `🔔 Your Turn is Coming Soon - Dr. ${doctorName}`;
  
  // Urgent styling for position 1-2
  const headerBg = isUrgent 
    ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
    : 'linear-gradient(135deg, #6366f1, #8b5cf6)';
  const headerText = isUrgent ? '🚨 GET READY NOW!' : '⏰ Your Turn is Approaching!';
  const alertBg = isUrgent ? '#fef2f2' : '#fef3c7';
  const alertBorder = isUrgent ? '#ef4444' : '#f59e0b';
  const alertTextColor = isUrgent ? '#991b1b' : '#92400e';
  
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
      <div style="background: ${headerBg}; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${headerText}</h1>
        ${isUrgent ? '<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Please head to the clinic immediately!</p>' : ''}
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #334155;">Hello <strong>${patientName}</strong>,</p>
        
        <div style="background: ${alertBg}; border-left: 4px solid ${alertBorder}; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
          ${isUrgent ? '<p style="margin: 0 0 10px; color: #dc2626; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">⚡ ALMOST YOUR TURN ⚡</p>' : ''}
          <p style="margin: 0; color: ${alertTextColor}; font-weight: 600;">
            ${queuePosition === 1 
              ? '<span style="font-size: 32px;">🎯</span><br><strong style="font-size: 24px; color: #dc2626;">YOU ARE NEXT!</strong>' 
              : `<span style="font-size: 24px;">📍</span> Only <strong style="font-size: 28px; color: ${isUrgent ? '#dc2626' : '#d97706'};">${queuePosition}</strong> patient(s) before you`}
          </p>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #64748b;">Doctor:</td>
              <td style="padding: 10px 0; color: #1e293b; font-weight: 600; text-align: right;">Dr. ${doctorName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b;">Your Slot Time:</td>
              <td style="padding: 10px 0; color: #1e293b; font-weight: 600; text-align: right;">${appointmentTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b;">Estimated Wait:</td>
              <td style="padding: 10px 0; color: ${isUrgent ? '#dc2626' : '#059669'}; font-weight: 600; text-align: right;">~${estimatedTime} minutes</td>
            </tr>
          </table>
        </div>
        
        <div style="background: ${isUrgent ? '#fef2f2' : '#ecfdf5'}; border: 1px solid ${isUrgent ? '#fecaca' : '#a7f3d0'}; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: ${isUrgent ? '#991b1b' : '#065f46'}; font-size: 14px;">
            ${isUrgent 
              ? '<strong>⚠️ ACTION REQUIRED:</strong> Please proceed to the clinic NOW. If you are not present when called, you may lose your turn.'
              : '<strong>💡 Tip:</strong> Please arrive at the clinic soon to avoid missing your turn. We recommend being present at least 10 minutes before your estimated time.'}
          </p>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          This is an automated AI-powered notification from HealthSync. Your actual wait time may vary based on consultation duration.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} HealthSync - Your Health, Our Priority</p>
        <p style="margin: 5px 0 0; font-size: 11px;">🤖 Smart Queue Management powered by AI</p>
      </div>
    </div>
  `;

  try {
    await sendEmail(patientEmail, subject, html);
    console.log(`✅ Queue notification sent to ${patientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send queue notification:', error);
    return { success: false, error: error.message };
  }
}

// Send queue booking confirmation email with estimated arrival time
async function sendQueueBookingEmail({ patientName, patientEmail, doctorName, specialization, clinicName, date, queueNumber, estimatedTime, consultationType, tokenNumber }) {
  const subject = `✅ Appointment Confirmed - Queue #${queueNumber} | Dr. ${doctorName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px 20px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Your appointment has been successfully scheduled</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          <p style="color: #334155; font-size: 16px; margin-bottom: 25px;">Dear <strong>${patientName}</strong>,</p>
          
          <!-- Queue Token Display -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 25px; text-align: center; margin-bottom: 25px;">
            <p style="color: rgba(255,255,255,0.8); margin: 0 0 5px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Queue Token</p>
            <p style="color: white; margin: 0; font-size: 48px; font-weight: 800;">#${queueNumber}</p>
            ${tokenNumber ? `<p style="color: rgba(255,255,255,0.7); margin: 10px 0 0; font-size: 12px;">Token: ${tokenNumber}</p>` : ''}
          </div>
          
          <!-- Estimated Time -->
          <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
            <p style="color: #059669; margin: 0 0 5px; font-size: 14px; font-weight: 600;">⏰ ESTIMATED ARRIVAL TIME</p>
            <p style="color: #047857; margin: 0; font-size: 32px; font-weight: 700;">${estimatedTime}</p>
            <p style="color: #6b7280; margin: 10px 0 0; font-size: 13px;">Please arrive 15 minutes before this time</p>
          </div>
          
          <!-- Appointment Details -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px;">📋 Appointment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Doctor</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">Dr. ${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Specialization</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; text-align: right; border-top: 1px solid #e2e8f0;">${specialization}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Clinic</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; text-align: right; border-top: 1px solid #e2e8f0;">${clinicName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Date</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e2e8f0;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Type</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; text-align: right; border-top: 1px solid #e2e8f0;">${consultationType === 'online' ? '🎥 Video Consultation' : '🏥 In-Person Visit'}</td>
              </tr>
            </table>
          </div>
          
          <!-- Important Notes -->
          <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #92400e; margin: 0 0 10px; font-size: 14px;">⚠️ Important Notes</h4>
            <ul style="color: #78350f; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
              <li>Your estimated time is calculated based on your queue position</li>
              <li>Actual time may vary depending on previous consultations</li>
              <li>You will receive a notification when your turn is approaching</li>
              ${consultationType === 'in_person' ? '<li>Please bring your ID and any previous medical records</li>' : '<li>Video call link will be sent 15 minutes before your turn</li>'}
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">
            Thank you for choosing HealthSync Pro!<br>
            <span style="color: #667eea;">Your health is our priority 💙</span>
          </p>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
          © ${new Date().getFullYear()} HealthSync Pro. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({ to: patientEmail, subject, html });
    console.log(`✅ Queue booking email sent to ${patientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending queue booking email:', error.message);
    return { success: false, error: error.message };
  }
}

// ---- Send Cancellation Email ----
async function sendCancellationEmail({
  recipientEmail,
  recipientName,
  recipientType,
  doctorName,
  patientName,
  appointmentDate,
  appointmentTime,
  reason,
  cancelledBy
}) {
  try {
    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }

    // Format date
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });

    // Format time
    let displayTime = appointmentTime || 'Time not set';
    if (appointmentTime && appointmentTime.includes(':')) {
      const [hours, minutes] = appointmentTime.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      displayTime = `${hour12}:${minutes} ${ampm} IST`;
    }

    const otherPartyName = recipientType === 'patient' ? `Dr. ${doctorName}` : patientName;
    const cancelledByText = cancelledBy === 'patient' ? 'the patient' : 
                           cancelledBy === 'doctor' ? 'the doctor' : 
                           cancelledBy === 'clinic' ? 'the clinic' : 'the system';

    const subject = `Appointment Cancelled - ${formattedDate}`;

    const text = `
Dear ${recipientName},

Your appointment has been cancelled.

Appointment Details:
- ${recipientType === 'patient' ? 'Doctor' : 'Patient'}: ${otherPartyName}
- Date: ${formattedDate}
- Time: ${displayTime}

Cancellation Reason: ${reason || 'No reason provided'}
Cancelled by: ${cancelledByText}

If you need to reschedule, please visit HealthSync to book a new appointment.

Thank you for using HealthSync.
    `;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f2f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .content { padding: 30px; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .alert-box h3 { color: #dc2626; margin-bottom: 8px; font-size: 16px; }
    .alert-box p { color: #7f1d1d; font-size: 14px; }
    .appointment-card { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #4b5563; width: 120px; }
    .detail-value { color: #1f2937; flex: 1; }
    .reason-box { background: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; margin: 20px 0; }
    .reason-box h4 { color: #92400e; margin-bottom: 8px; font-size: 14px; }
    .reason-box p { color: #78350f; font-size: 14px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 HealthSync</h1>
      <p>Appointment Cancellation Notice</p>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <h3>❌ Appointment Cancelled</h3>
        <p>Your scheduled appointment has been cancelled by ${cancelledByText}.</p>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 10px;">Hello ${recipientName},</h2>
      <p style="color: #6b7280; margin-bottom: 20px;">We're sorry to inform you that your appointment has been cancelled.</p>

      <div class="appointment-card">
        <div class="detail-row">
          <div class="detail-label">${recipientType === 'patient' ? 'Doctor:' : 'Patient:'}</div>
          <div class="detail-value">${otherPartyName}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Date:</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Time:</div>
          <div class="detail-value">${displayTime}</div>
        </div>
      </div>
      
      <div class="reason-box">
        <h4>📝 Cancellation Reason</h4>
        <p>${reason || 'No reason provided'}</p>
      </div>
      
      <p style="color: #6b7280; margin-top: 20px;">
        If you need to reschedule, please visit HealthSync to book a new appointment at your convenience.
      </p>
      
      <center>
        <a href="${process.env.FRONTEND_URL || 'https://healthsync.com'}" class="cta-button">
          Book New Appointment
        </a>
      </center>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} HealthSync. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({ to: recipientEmail, subject, html, text });
    console.log(`📧 Cancellation email sent to ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOTP,
  verifyOTP,
  sendTestEmail,
  sendAppointmentEmail,
  sendEmail,
  sendQueueNotificationEmail,
  sendQueueBookingEmail,
  sendCancellationEmail,
};
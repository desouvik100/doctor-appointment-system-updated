// Test script to send email directly to Gmail
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testDirectEmail() {
  console.log('📧 Testing direct email to Gmail...\n');
  
  // Send directly to Gmail, not through Cloudflare routing
  const directEmail = 'desouvik0000@gmail.com';
  
  console.log('Configuration:');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER);
  console.log('  Sending to:', directEmail);
  console.log('');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"HealthSync Pro" <${process.env.EMAIL_USER}>`,
    to: directEmail,
    subject: '✅ HealthSync Pro - Direct Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6366f1;">🏥 HealthSync Pro</h1>
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #059669; margin: 0;">✅ Direct Email Test Successful!</h2>
          <p>This email was sent directly to your Gmail (not through Cloudflare routing).</p>
        </div>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        <p>If you receive this but not the admin@healthsyncpro.in email, there may be an issue with Cloudflare email routing.</p>
      </div>
    `,
    text: `HealthSync Pro - Direct Test Email\n\nThis email was sent directly to your Gmail.\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Direct email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Sent to:', directEmail);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}

testDirectEmail();

const nodemailer = require('nodemailer');
require('dotenv').config();

// Test email configuration
async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📧 Email User:', process.env.EMAIL_USER);
  console.log('🔑 Email Pass:', process.env.EMAIL_PASS ? '***configured***' : '❌ NOT SET');
  console.log('');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not configured in .env file');
    return;
  }
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('🔧 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Generate test OTP
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 Generated test OTP:', testOTP);
    
    // Send test email
    console.log('📤 Sending test email...');
    
    const mailOptions = {
      from: {
        name: 'HealthSync Pro',
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'HealthSync Pro - Test OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>🏥 HealthSync Pro</h1>
            <h2>Test Email</h2>
          </div>
          <div style="background: #f8f9fa; padding: 20px;">
            <h3>Email Test Successful!</h3>
            <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <p><strong>Your Test OTP:</strong></p>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${testOTP}</div>
            </div>
            <p>If you received this email, your OTP system is working correctly!</p>
          </div>
        </div>
      `,
      text: `HealthSync Pro Test Email\n\nYour test OTP: ${testOTP}\n\nIf you received this email, your OTP system is working correctly!`
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Check your email inbox for the test OTP');
    
  } catch (error) {
    console.log('❌ Email test failed:');
    console.log('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication Error - Try these fixes:');
      console.log('1. Make sure 2-Factor Authentication is enabled on your Gmail');
      console.log('2. Generate a new App Password (not your regular password)');
      console.log('3. Use the 16-character app password in EMAIL_PASS');
      console.log('4. Check that EMAIL_USER is your full Gmail address');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection Error - Try these fixes:');
      console.log('1. Check your internet connection');
      console.log('2. Try a different network (some networks block SMTP)');
      console.log('3. Temporarily disable firewall/antivirus');
    }
  }
}

// Run the test
testEmail();
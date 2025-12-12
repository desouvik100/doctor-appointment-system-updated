// Test script to send email to admin@healthsyncpro.in
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testAdminEmail() {
  console.log('📧 Testing email to admin@healthsyncpro.in...\n');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@healthsyncpro.in';
  
  console.log('Configuration:');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER);
  console.log('  ADMIN_EMAIL:', adminEmail);
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
    to: adminEmail,
    subject: '✅ HealthSync Pro - Test Email Successful',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .success-box { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .success-box h2 { color: #059669; margin: 0 0 10px 0; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .info-table td:first-child { font-weight: 600; color: #374151; width: 40%; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 HealthSync Pro</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <h2>✅ Email Configuration Successful!</h2>
              <p>This test email confirms that your admin email is properly configured and receiving messages.</p>
            </div>
            
            <h3>Configuration Details:</h3>
            <table class="info-table">
              <tr>
                <td>Admin Email</td>
                <td>${adminEmail}</td>
              </tr>
              <tr>
                <td>Sender Email</td>
                <td>${process.env.EMAIL_USER}</td>
              </tr>
              <tr>
                <td>Test Time</td>
                <td>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
              </tr>
              <tr>
                <td>Environment</td>
                <td>${process.env.NODE_ENV || 'development'}</td>
              </tr>
            </table>
            
            <p>You will now receive:</p>
            <ul>
              <li>🔒 Security alerts and notifications</li>
              <li>📊 System status updates</li>
              <li>👤 User activity reports</li>
              <li>⚠️ Critical error notifications</li>
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} HealthSync Pro. All rights reserved.</p>
            <p>This is an automated test message.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `HealthSync Pro - Test Email\n\nThis test email confirms that your admin email (${adminEmail}) is properly configured.\n\nTest Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nYou will now receive security alerts, system updates, and notifications at this address.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Sent to:', adminEmail);
    console.log('\n📬 Check your inbox at admin@healthsyncpro.in');
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    if (error.code === 'EAUTH') {
      console.log('\n💡 Tip: Make sure EMAIL_PASS is a Gmail App Password, not your regular password.');
    }
  }
}

testAdminEmail();

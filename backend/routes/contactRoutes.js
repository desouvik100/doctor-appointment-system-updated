// Contact/Support Routes - Handle user support messages
const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');

const SUPPORT_EMAIL = process.env.ADMIN_EMAIL || 'support@healthsyncpro.in';

// Submit contact form / support message
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, subject, and message are required' 
      });
    }

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Send email to admin/support
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 25px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 22px; }
          .content { padding: 25px; }
          .info-card { background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
          .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #64748b; width: 120px; font-weight: 500; }
          .info-value { color: #1e293b; flex: 1; }
          .message-box { background: #f0f9ff; border-left: 4px solid #6366f1; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .message-title { color: #1e293b; font-weight: 600; margin-bottom: 10px; }
          .message-content { color: #475569; line-height: 1.7; white-space: pre-wrap; }
          .footer { background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 12px; }
          .reply-btn { display: inline-block; padding: 12px 25px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 New Support Message</h1>
          </div>
          <div class="content">
            <p style="color: #475569; margin-bottom: 20px;">You have received a new message from the HealthSync contact form.</p>
            
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">👤 Name</span>
                <span class="info-value">${name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📧 Email</span>
                <span class="info-value"><a href="mailto:${email}" style="color: #6366f1;">${email}</a></span>
              </div>
              <div class="info-row">
                <span class="info-label">📱 Phone</span>
                <span class="info-value">${phone || 'Not provided'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📋 Subject</span>
                <span class="info-value">${subject}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🕐 Received</span>
                <span class="info-value">${timestamp}</span>
              </div>
            </div>

            <div class="message-box">
              <div class="message-title">💬 Message:</div>
              <div class="message-content">${message}</div>
            </div>

            <div style="text-align: center;">
              <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" class="reply-btn">
                ↩️ Reply to ${name}
              </a>
            </div>
          </div>
          <div class="footer">
            <p>HealthSync Support System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `📬 [Support] ${subject} - from ${name}`,
      html: adminHtml,
      text: `New Support Message\n\nFrom: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nSubject: ${subject}\nTime: ${timestamp}\n\nMessage:\n${message}`
    });

    // Send confirmation email to user
    const userHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
          .message-preview { background: #f8fafc; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Message Received!</h1>
          </div>
          <div class="content">
            <div class="success-icon">📨</div>
            <h2 style="text-align: center; color: #1e293b;">Thank you for contacting us, ${name}!</h2>
            <p style="text-align: center; color: #64748b;">We have received your message and will get back to you within 24-48 hours.</p>
            
            <div class="message-preview">
              <p style="color: #64748b; margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="color: #64748b; margin: 0;"><strong>Your message:</strong></p>
              <p style="color: #475569; margin: 10px 0 0 0; white-space: pre-wrap;">${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</p>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              If your matter is urgent, you can also reach us at:
            </p>
            <ul style="color: #64748b; font-size: 14px;">
              <li>📧 Email: <a href="mailto:support@healthsyncpro.in" style="color: #6366f1;">support@healthsyncpro.in</a></li>
              <li>📞 Phone: +91-7001268485</li>
              <li>💬 WhatsApp: +91-7001268485</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>HealthSync Healthcare Platform</strong></p>
            <p>© ${new Date().getFullYear()} HealthSync. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: `✅ We received your message - HealthSync Support`,
      html: userHtml,
      text: `Thank you for contacting HealthSync!\n\nWe have received your message regarding "${subject}" and will get back to you within 24-48 hours.\n\nYour message:\n${message}\n\n---\nHealthSync Support Team\nEmail: support@healthsyncpro.in\nPhone: +91-7001268485`
    });

    console.log(`✅ Support message received from ${name} (${email})`);

    res.json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.'
    });

  } catch (error) {
    console.error('❌ Error submitting contact form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again or contact us directly.',
      error: error.message 
    });
  }
});

// Get support contact info
router.get('/info', (req, res) => {
  res.json({
    success: true,
    contact: {
      email: 'support@healthsyncpro.in',
      phone: '+91-7001268485',
      whatsapp: '+91-7001268485',
      address: 'Bankura, West Bengal, India - 722101',
      hours: 'Monday - Saturday, 9:00 AM - 6:00 PM IST'
    }
  });
});

module.exports = router;

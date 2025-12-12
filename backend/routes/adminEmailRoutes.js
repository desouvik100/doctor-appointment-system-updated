// Admin Email Routes - Send custom emails to users, doctors, staff
const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');
const { 
  sendAnalyticsReport, 
  sendSystemHealthAlert, 
  sendNewDoctorRegistrationAlert, 
  sendRevenueSummary 
} = require('../services/adminEmailService');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Send custom email to specific recipient
router.post('/send', async (req, res) => {
  try {
    const { recipientEmail, recipientName, subject, message, recipientType } = req.body;

    if (!recipientEmail || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient email, subject, and message are required' 
      });
    }

    const html = generateEmailTemplate({
      recipientName: recipientName || 'User',
      subject,
      message,
      recipientType: recipientType || 'user'
    });

    const text = `${subject}\n\n${message}\n\n---\nHealthSync Team`;

    await sendEmail({
      to: recipientEmail,
      subject: `HealthSync: ${subject}`,
      html,
      text
    });

    console.log(`✅ Admin email sent to ${recipientEmail}`);

    res.json({
      success: true,
      message: `Email sent successfully to ${recipientEmail}`
    });

  } catch (error) {
    console.error('❌ Error sending admin email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: error.message 
    });
  }
});

// Send bulk email to all users of a type
router.post('/send-bulk', async (req, res) => {
  try {
    const { recipientType, subject, message } = req.body;

    if (!recipientType || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient type, subject, and message are required' 
      });
    }

    let recipients = [];

    if (recipientType === 'doctors' || recipientType === 'all') {
      const doctors = await Doctor.find({ isActive: true }).select('name email');
      recipients = recipients.concat(doctors.map(d => ({ 
        email: d.email, 
        name: d.name, 
        type: 'doctor' 
      })));
    }

    if (recipientType === 'users' || recipientType === 'patients' || recipientType === 'all') {
      const users = await User.find({ role: 'patient' }).select('name email');
      recipients = recipients.concat(users.map(u => ({ 
        email: u.email, 
        name: u.name, 
        type: 'patient' 
      })));
    }

    if (recipientType === 'staff' || recipientType === 'all') {
      const staff = await User.find({ role: { $in: ['receptionist', 'admin'] } }).select('name email');
      recipients = recipients.concat(staff.map(s => ({ 
        email: s.email, 
        name: s.name, 
        type: 'staff' 
      })));
    }

    // Filter out invalid emails
    recipients = recipients.filter(r => r.email && r.email.includes('@'));

    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      try {
        const html = generateEmailTemplate({
          recipientName: recipient.name,
          subject,
          message,
          recipientType: recipient.type
        });

        await sendEmail({
          to: recipient.email,
          subject: `HealthSync: ${subject}`,
          html,
          text: `${subject}\n\n${message}\n\n---\nHealthSync Team`
        });

        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${recipient.email}:`, err.message);
        failCount++;
      }
    }

    res.json({
      success: true,
      message: `Bulk email completed`,
      stats: {
        total: recipients.length,
        sent: successCount,
        failed: failCount
      }
    });

  } catch (error) {
    console.error('❌ Error sending bulk email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send bulk email',
      error: error.message 
    });
  }
});

// Get all recipients for dropdown
router.get('/recipients', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true }).select('name email specialization');
    const users = await User.find({}).select('name email role');

    const recipients = {
      doctors: doctors.map(d => ({
        id: d._id,
        name: `Dr. ${d.name}`,
        email: d.email,
        type: 'doctor',
        specialization: d.specialization
      })),
      patients: users.filter(u => u.role === 'patient').map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        type: 'patient'
      })),
      staff: users.filter(u => ['receptionist', 'admin'].includes(u.role)).map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        type: u.role
      }))
    };

    res.json({
      success: true,
      recipients
    });

  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recipients' 
    });
  }
});

// Generate professional email template
function generateEmailTemplate({ recipientName, subject, message, recipientType }) {
  const typeColors = {
    doctor: '#059669',
    patient: '#6366f1',
    staff: '#f59e0b',
    user: '#6366f1'
  };

  const color = typeColors[recipientType] || '#6366f1';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${color} 0%, #1e293b 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🏥 HealthSync</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Healthcare Management Platform</p>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">Hello ${recipientName}! 👋</h2>
      
      <div style="background: #f9fafb; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">${subject}</h3>
        <div style="color: #4b5563; line-height: 1.7; white-space: pre-wrap;">${message}</div>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
      
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        If you have any questions, please contact us at <a href="mailto:support@healthsyncpro.in" style="color: ${color};">support@healthsyncpro.in</a>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">© ${new Date().getFullYear()} HealthSync. All rights reserved.</p>
      <p style="margin: 5px 0 0 0;">Bankura, West Bengal, India - 722101</p>
      <p style="margin: 5px 0 0 0;">📞 +91-7001268485</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================
// MANUAL TEST ENDPOINTS FOR ADMIN REPORTS
// ============================================

// Test daily/weekly analytics report
router.post('/test/analytics', async (req, res) => {
  try {
    const { period = 'daily' } = req.body;
    console.log(`📊 Manually triggering ${period} analytics report...`);
    
    const result = await sendAnalyticsReport(period);
    
    if (result.success) {
      res.json({ success: true, message: `${period} analytics report sent successfully` });
    } else {
      res.status(500).json({ success: false, message: result.reason || result.error });
    }
  } catch (error) {
    console.error('Error sending analytics report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test system health alert
router.post('/test/health-alert', async (req, res) => {
  try {
    const { alertType = 'server_restart', details = 'Manual test alert from admin panel' } = req.body;
    console.log(`🚨 Manually triggering ${alertType} health alert...`);
    
    const result = await sendSystemHealthAlert(alertType, details);
    
    if (result.success) {
      res.json({ success: true, message: `${alertType} health alert sent successfully` });
    } else {
      res.status(500).json({ success: false, message: result.reason || result.error });
    }
  } catch (error) {
    console.error('Error sending health alert:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test doctor registration alert
router.post('/test/doctor-registration', async (req, res) => {
  try {
    const testDoctor = req.body.doctor || {
      name: 'Test Doctor',
      email: 'test.doctor@example.com',
      phone: '9876543210',
      specialization: 'General Medicine',
      clinicName: 'Test Clinic',
      consultationFee: 500,
      location: 'Bankura'
    };
    
    console.log(`👨‍⚕️ Manually triggering doctor registration alert...`);
    
    const result = await sendNewDoctorRegistrationAlert(testDoctor);
    
    if (result.success) {
      res.json({ success: true, message: 'Doctor registration alert sent successfully' });
    } else {
      res.status(500).json({ success: false, message: result.reason || result.error });
    }
  } catch (error) {
    console.error('Error sending doctor registration alert:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test revenue summary
router.post('/test/revenue', async (req, res) => {
  try {
    const { period = 'weekly' } = req.body;
    console.log(`💰 Manually triggering ${period} revenue summary...`);
    
    const result = await sendRevenueSummary(period);
    
    if (result.success) {
      res.json({ success: true, message: `${period} revenue summary sent successfully` });
    } else {
      res.status(500).json({ success: false, message: result.reason || result.error });
    }
  } catch (error) {
    console.error('Error sending revenue summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get available alert types
router.get('/alert-types', (req, res) => {
  res.json({
    success: true,
    alertTypes: [
      { type: 'database_error', severity: 'critical', description: 'Database connection issues' },
      { type: 'high_error_rate', severity: 'warning', description: 'High error rate detected' },
      { type: 'server_restart', severity: 'info', description: 'Server restart notification' },
      { type: 'memory_warning', severity: 'warning', description: 'High memory usage' },
      { type: 'payment_failure', severity: 'critical', description: 'Payment system errors' },
      { type: 'security_breach', severity: 'critical', description: 'Security alert' },
      { type: 'api_timeout', severity: 'warning', description: 'API timeout issues' },
      { type: 'backup_complete', severity: 'info', description: 'Backup completed' }
    ]
  });
});

module.exports = router;

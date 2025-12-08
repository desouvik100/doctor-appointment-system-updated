const express = require('express');
const router = express.Router();
const aiSecurityService = require('../services/aiSecurityService');
const SuspiciousActivity = require('../models/SuspiciousActivity');

// Get all security alerts (admin only)
router.get('/alerts', async (req, res) => {
  try {
    const { status, severity, activityType, userType, startDate, endDate, limit } = req.query;
    
    const alerts = await aiSecurityService.getAlerts({
      status, severity, activityType, userType, startDate, endDate,
      limit: parseInt(limit) || 100
    });

    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
});

// Get security dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await aiSecurityService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// Get single alert details
router.get('/alerts/:id', async (req, res) => {
  try {
    const alert = await SuspiciousActivity.findById(req.params.id)
      .populate('reviewedBy', 'name email')
      .populate('actionsTaken.takenBy', 'name email');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alert' });
  }
});

// Update alert status
router.put('/alerts/:id/status', async (req, res) => {
  try {
    const { status, adminId, notes } = req.body;
    
    if (!['new', 'investigating', 'confirmed', 'false_positive', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const alert = await aiSecurityService.updateAlertStatus(req.params.id, status, adminId, notes);
    res.json({ success: true, alert, message: 'Alert status updated' });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update alert' });
  }
});

// Add action to alert
router.post('/alerts/:id/action', async (req, res) => {
  try {
    const { action, adminId, notes } = req.body;
    
    const alert = await SuspiciousActivity.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.actionsTaken.push({
      action,
      takenBy: adminId,
      notes
    });
    await alert.save();

    res.json({ success: true, alert, message: 'Action recorded' });
  } catch (error) {
    console.error('Error adding action:', error);
    res.status(500).json({ success: false, message: 'Failed to add action' });
  }
});

// Get alerts for specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const alerts = await SuspiciousActivity.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Error fetching user alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
});

// Manually log suspicious activity (for testing or manual reporting)
router.post('/report', async (req, res) => {
  try {
    const alert = await aiSecurityService.createAlert(req.body);
    res.json({ success: true, alert, message: 'Activity reported' });
  } catch (error) {
    console.error('Error reporting activity:', error);
    res.status(500).json({ success: false, message: 'Failed to report activity' });
  }
});

// Get recent critical alerts (for dashboard widget)
router.get('/critical', async (req, res) => {
  try {
    const alerts = await SuspiciousActivity.find({
      severity: { $in: ['high', 'critical'] },
      status: 'new'
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, alerts, count: alerts.length });
  } catch (error) {
    console.error('Error fetching critical alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
});

// Bulk update alerts
router.put('/alerts/bulk-update', async (req, res) => {
  try {
    const { alertIds, status, adminId } = req.body;
    
    await SuspiciousActivity.updateMany(
      { _id: { $in: alertIds } },
      { 
        $set: { status, reviewedBy: adminId, reviewedAt: new Date() },
        $push: { actionsTaken: { action: `Bulk status change to ${status}`, takenBy: adminId } }
      }
    );

    res.json({ success: true, message: `${alertIds.length} alerts updated` });
  } catch (error) {
    console.error('Error bulk updating:', error);
    res.status(500).json({ success: false, message: 'Failed to update alerts' });
  }
});

// Simulate test alerts (for testing the security system)
router.post('/test-alerts', async (req, res) => {
  try {
    const testAlerts = [
      {
        userType: 'Doctor',
        userName: 'Dr. Test User',
        userEmail: 'test.doctor@healthsync.com',
        activityType: 'multiple_failed_logins',
        severity: 'high',
        confidenceScore: 95,
        description: '8 failed login attempts detected from IP 192.168.1.100',
        details: { ipAddress: '192.168.1.100', attemptCount: 8, timeWindow: '15 minutes' }
      },
      {
        userType: 'Receptionist',
        userName: 'Staff Member',
        userEmail: 'staff@healthsync.com',
        activityType: 'bulk_data_access',
        severity: 'medium',
        confidenceScore: 75,
        description: 'Bulk data access: 150 patient records exported',
        details: { endpoint: '/api/patients/export', affectedRecords: 150 }
      },
      {
        userType: 'User',
        userName: 'Suspicious Patient',
        userEmail: 'patient@test.com',
        activityType: 'unauthorized_access',
        severity: 'critical',
        confidenceScore: 90,
        description: 'Non-admin user attempted to access admin endpoint /api/admin/users',
        details: { endpoint: '/api/admin/users', method: 'DELETE', ipAddress: '203.0.113.50' }
      },
      {
        userType: 'Admin',
        userName: 'Admin User',
        userEmail: 'admin@healthsync.com',
        activityType: 'off_hours_access',
        severity: 'low',
        confidenceScore: 40,
        description: 'System access during off-hours (2:30 AM)',
        details: { ipAddress: '10.0.0.1', timeWindow: '2:30 local time' }
      },
      {
        userType: 'Doctor',
        userName: 'Dr. Rapid Actions',
        userEmail: 'rapid.doctor@healthsync.com',
        activityType: 'rapid_actions',
        severity: 'medium',
        confidenceScore: 85,
        description: 'Unusually high activity detected: 75 actions in 1 minute',
        details: { actionCount: 75, timeWindow: '1 minute', ipAddress: '172.16.0.50' }
      }
    ];

    const createdAlerts = [];
    for (const alertData of testAlerts) {
      const alert = await aiSecurityService.createAlert(alertData);
      if (alert) createdAlerts.push(alert);
    }

    res.json({ 
      success: true, 
      message: `${createdAlerts.length} test alerts created`,
      alerts: createdAlerts
    });
  } catch (error) {
    console.error('Error creating test alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to create test alerts' });
  }
});

// Clear all test alerts (cleanup)
router.delete('/test-alerts', async (req, res) => {
  try {
    const result = await SuspiciousActivity.deleteMany({
      userEmail: { $regex: /@(test|healthsync)\.com$/i }
    });
    
    res.json({ 
      success: true, 
      message: `${result.deletedCount} test alerts deleted`
    });
  } catch (error) {
    console.error('Error deleting test alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to delete test alerts' });
  }
});

// ============ ENHANCED SECURITY ENDPOINTS ============

// Get security analytics
router.get('/analytics', async (req, res) => {
  try {
    const { days } = req.query;
    const analytics = await aiSecurityService.getSecurityAnalytics(parseInt(days) || 30);
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// Generate security report
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and end dates required' });
    }
    const report = await aiSecurityService.generateSecurityReport(startDate, endDate);
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

// Get blocked IPs
router.get('/blocked-ips', async (req, res) => {
  try {
    const blockedIPs = aiSecurityService.getBlockedIPs();
    res.json({ success: true, blockedIPs });
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blocked IPs' });
  }
});

// Block an IP manually
router.post('/block-ip', async (req, res) => {
  try {
    const { ipAddress, reason, duration } = req.body;
    if (!ipAddress) {
      return res.status(400).json({ success: false, message: 'IP address required' });
    }
    aiSecurityService.blockIP(ipAddress, reason || 'Manually blocked by admin', duration);
    res.json({ success: true, message: `IP ${ipAddress} blocked` });
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({ success: false, message: 'Failed to block IP' });
  }
});

// Unblock an IP
router.delete('/block-ip/:ip', async (req, res) => {
  try {
    aiSecurityService.unblockIP(req.params.ip);
    res.json({ success: true, message: `IP ${req.params.ip} unblocked` });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ success: false, message: 'Failed to unblock IP' });
  }
});

// Suspend user
router.post('/suspend-user', async (req, res) => {
  try {
    const { userId, reason, adminId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID or Email required' });
    }
    
    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    const { sendEmail } = require('../services/emailService');
    
    // Check if userId is an email or MongoDB ObjectId
    const isEmail = userId.includes('@');
    let user = null;
    let userType = 'patient';
    
    if (isEmail) {
      // Search by email
      user = await User.findOne({ email: userId });
      if (!user) {
        user = await Doctor.findOne({ email: userId });
        if (user) userType = 'doctor';
      }
    } else {
      // Search by ID
      try {
        user = await User.findById(userId);
        if (!user) {
          user = await Doctor.findById(userId);
          if (user) userType = 'doctor';
        }
      } catch (idError) {
        // Invalid ObjectId format, try email search as fallback
        user = await User.findOne({ email: userId });
        if (!user) {
          user = await Doctor.findOne({ email: userId });
          if (user) userType = 'doctor';
        }
      }
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with provided ID or email' });
    }
    
    // Suspend the user
    if (userType === 'doctor') {
      await Doctor.findByIdAndUpdate(user._id, {
        isActive: false,
        suspendedAt: new Date(),
        suspendReason: reason || 'Suspended by admin'
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        isActive: false,
        suspendedAt: new Date(),
        suspendReason: reason || 'Suspended by admin'
      });
    }

    // Send email notification to user
    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: '⚠️ Account Suspended - HealthSync',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">⚠️ Account Suspended</h1>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
                <p>Dear ${user.name},</p>
                <p>Your HealthSync account has been <strong style="color: #ef4444;">suspended</strong> due to security concerns.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ef4444;">
                  <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || 'Security violation detected'}</p>
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>If you believe this is a mistake, please contact our support team immediately.</p>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                  This action was taken to protect your account and our platform's security.
                </p>
              </div>
              <div style="background: #343a40; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
                <p style="color: #adb5bd; margin: 0; font-size: 12px;">HealthSync Security Team</p>
              </div>
            </div>
          `
        });
        console.log(`📧 Suspension email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Error sending suspension email:', emailError);
      }
    }

    // Create alert
    await aiSecurityService.createAlert({
      userId: user._id,
      userType: userType === 'doctor' ? 'Doctor' : 'User',
      userName: user.name,
      userEmail: user.email,
      activityType: 'account_manipulation',
      severity: 'high',
      confidenceScore: 100,
      description: `Account manually suspended by admin: ${reason || 'No reason provided'}`,
      details: { action: 'manual_suspend', adminId }
    });

    res.json({ success: true, message: 'User suspended and notified via email' });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ success: false, message: 'Failed to suspend user' });
  }
});

// Unsuspend user
router.post('/unsuspend-user', async (req, res) => {
  try {
    const { userId, adminId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID or Email required' });
    }
    
    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    const { sendEmail } = require('../services/emailService');
    
    // Check if userId is an email or MongoDB ObjectId
    const isEmail = userId.includes('@');
    let user = null;
    let userType = 'patient';
    
    if (isEmail) {
      user = await User.findOne({ email: userId });
      if (!user) {
        user = await Doctor.findOne({ email: userId });
        if (user) userType = 'doctor';
      }
    } else {
      try {
        user = await User.findById(userId);
        if (!user) {
          user = await Doctor.findById(userId);
          if (user) userType = 'doctor';
        }
      } catch (idError) {
        user = await User.findOne({ email: userId });
        if (!user) {
          user = await Doctor.findOne({ email: userId });
          if (user) userType = 'doctor';
        }
      }
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with provided ID or email' });
    }
    
    // Unsuspend the user
    if (userType === 'doctor') {
      await Doctor.findByIdAndUpdate(user._id, {
        isActive: true,
        $unset: { suspendedAt: 1, suspendReason: 1 }
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        isActive: true,
        $unset: { suspendedAt: 1, suspendReason: 1 }
      });
    }

    // Send email notification to user
    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: '✅ Account Restored - HealthSync',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">✅ Account Restored</h1>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
                <p>Dear ${user.name},</p>
                <p>Great news! Your HealthSync account has been <strong style="color: #10b981;">restored</strong> and is now active again.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981;">
                  <p style="margin: 5px 0;"><strong>Status:</strong> Active</p>
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>You can now log in and access all features of your account.</p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://healthsync.com'}/login" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                    Login to Your Account
                  </a>
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                  Thank you for your patience. If you have any questions, please contact our support team.
                </p>
              </div>
              <div style="background: #343a40; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
                <p style="color: #adb5bd; margin: 0; font-size: 12px;">HealthSync Security Team</p>
              </div>
            </div>
          `
        });
        console.log(`📧 Account restored email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Error sending unsuspend email:', emailError);
      }
    }

    // Log the action
    await aiSecurityService.createAlert({
      userId: user._id,
      userType: userType === 'doctor' ? 'Doctor' : 'User',
      userName: user.name,
      userEmail: user.email,
      activityType: 'account_manipulation',
      severity: 'low',
      confidenceScore: 100,
      description: `Account restored by admin`,
      details: { action: 'manual_unsuspend', adminId }
    });

    res.json({ success: true, message: 'User unsuspended and notified via email' });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({ success: false, message: 'Failed to unsuspend user' });
  }
});

// Force logout user
router.post('/force-logout', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID or Email required' });
    }
    
    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    const { sendEmail } = require('../services/emailService');
    
    // Check if userId is an email or MongoDB ObjectId
    const isEmail = userId.includes('@');
    let user = null;
    let userType = 'patient';
    
    if (isEmail) {
      user = await User.findOne({ email: userId });
      if (!user) {
        user = await Doctor.findOne({ email: userId });
        if (user) userType = 'doctor';
      }
    } else {
      try {
        user = await User.findById(userId);
        if (!user) {
          user = await Doctor.findById(userId);
          if (user) userType = 'doctor';
        }
      } catch (idError) {
        user = await User.findOne({ email: userId });
        if (!user) {
          user = await Doctor.findOne({ email: userId });
          if (user) userType = 'doctor';
        }
      }
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with provided ID or email' });
    }
    
    // Force logout via the service
    await aiSecurityService.forceLogout(user._id, reason || 'Forced logout by admin');

    // Send email notification to user
    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: '🔒 Security Alert: Session Terminated - HealthSync',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">🔒 Session Terminated</h1>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
                <p>Dear ${user.name},</p>
                <p>Your HealthSync session has been <strong style="color: #f59e0b;">terminated</strong> for security reasons.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || 'Security precaution'}</p>
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>If this was you, you can log in again. If you did not expect this, please:</p>
                <ul style="color: #4b5563; margin: 10px 0;">
                  <li>Change your password immediately</li>
                  <li>Review your recent account activity</li>
                  <li>Contact support if you notice anything suspicious</li>
                </ul>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://healthsync.com'}/login" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                    Login Again
                  </a>
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                  This action was taken to protect your account security.
                </p>
              </div>
              <div style="background: #343a40; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
                <p style="color: #adb5bd; margin: 0; font-size: 12px;">HealthSync Security Team</p>
              </div>
            </div>
          `
        });
        console.log(`📧 Force logout email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Error sending force logout email:', emailError);
      }
    }

    res.json({ success: true, message: 'User logged out and notified via email' });
  } catch (error) {
    console.error('Error forcing logout:', error);
    res.status(500).json({ success: false, message: 'Failed to force logout' });
  }
});

// Check if IP is blocked (for middleware use)
router.get('/check-ip/:ip', async (req, res) => {
  try {
    const block = aiSecurityService.isIPBlocked(req.params.ip);
    res.json({ success: true, blocked: !!block, details: block || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check IP' });
  }
});

// Require password reset for user
router.post('/require-password-reset', async (req, res) => {
  try {
    const { userId, reason, adminId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID or Email required' });
    }
    
    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    const { sendEmail } = require('../services/emailService');
    
    // Check if userId is an email or MongoDB ObjectId
    const isEmail = userId.includes('@');
    let user = null;
    let userType = 'patient';
    
    if (isEmail) {
      user = await User.findOne({ email: userId });
      if (!user) {
        user = await Doctor.findOne({ email: userId });
        if (user) userType = 'doctor';
      }
    } else {
      try {
        user = await User.findById(userId);
        if (!user) {
          user = await Doctor.findById(userId);
          if (user) userType = 'doctor';
        }
      } catch (idError) {
        user = await User.findOne({ email: userId });
        if (!user) {
          user = await Doctor.findOne({ email: userId });
          if (user) userType = 'doctor';
        }
      }
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with provided ID or email' });
    }
    
    // Mark user as requiring password reset
    if (userType === 'doctor') {
      await Doctor.findByIdAndUpdate(user._id, {
        requirePasswordReset: true,
        passwordResetRequiredAt: new Date(),
        passwordResetReason: reason || 'Required by admin'
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        requirePasswordReset: true,
        passwordResetRequiredAt: new Date(),
        passwordResetReason: reason || 'Required by admin'
      });
    }

    // Send email notification to user
    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: '🔐 Password Reset Required - HealthSync',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">🔐 Password Reset Required</h1>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
                <p>Dear ${user.name},</p>
                <p>For security reasons, you are required to <strong style="color: #8b5cf6;">reset your password</strong> before you can continue using your HealthSync account.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #8b5cf6;">
                  <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || 'Security precaution'}</p>
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>Please reset your password as soon as possible to regain full access to your account.</p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://healthsync.com'}/forgot-password" 
                     style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                    Reset Password Now
                  </a>
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                  This action was taken to protect your account. If you have questions, please contact support.
                </p>
              </div>
              <div style="background: #343a40; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
                <p style="color: #adb5bd; margin: 0; font-size: 12px;">HealthSync Security Team</p>
              </div>
            </div>
          `
        });
        console.log(`📧 Password reset required email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
      }
    }

    // Log the action
    await aiSecurityService.createAlert({
      userId: user._id,
      userType: userType === 'doctor' ? 'Doctor' : 'User',
      userName: user.name,
      userEmail: user.email,
      activityType: 'account_manipulation',
      severity: 'medium',
      confidenceScore: 100,
      description: `Password reset required by admin: ${reason || 'No reason provided'}`,
      details: { action: 'require_password_reset', adminId }
    });

    res.json({ success: true, message: 'Password reset required and user notified via email' });
  } catch (error) {
    console.error('Error requiring password reset:', error);
    res.status(500).json({ success: false, message: 'Failed to require password reset' });
  }
});

// Send test admin email notification
router.post('/test-email', async (req, res) => {
  try {
    const testAlert = {
      _id: 'test-alert',
      severity: 'high',
      activityType: 'multiple_failed_logins',
      userName: 'Test User',
      userEmail: 'test@example.com',
      userType: 'User',
      description: 'This is a test security alert email',
      details: { ipAddress: '192.168.1.1' },
      confidenceScore: 95,
      createdAt: new Date()
    };
    
    const sent = await aiSecurityService.sendAdminEmailNotification(testAlert);
    res.json({ success: sent, message: sent ? 'Test email sent' : 'Failed to send email' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, message: 'Failed to send test email' });
  }
});

module.exports = router;

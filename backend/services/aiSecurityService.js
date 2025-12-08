const SuspiciousActivity = require('../models/SuspiciousActivity');

// In-memory tracking for real-time detection
const activityTracker = new Map();
const loginAttempts = new Map();
const dataAccessLog = new Map();
const blockedIPs = new Map();
const suspendedUsers = new Map();
const userLocations = new Map();

// Configuration thresholds
const THRESHOLDS = {
  MAX_FAILED_LOGINS: 5,           // Max failed logins before alert
  FAILED_LOGIN_WINDOW: 15 * 60000, // 15 minutes
  MAX_ACTIONS_PER_MINUTE: 60,     // Rate limit
  BULK_ACCESS_THRESHOLD: 50,      // Records accessed in short time
  OFF_HOURS_START: 23,            // 11 PM
  OFF_HOURS_END: 5,               // 5 AM
  RAPID_ACTION_WINDOW: 60000,     // 1 minute
  MAX_EXPORTS_PER_HOUR: 10,
  SUSPICIOUS_PAYMENT_AMOUNT: 50000, // ₹50,000
  AUTO_SUSPEND_VIOLATIONS: 3,     // Violations before auto-suspend
  IP_BLOCK_THRESHOLD: 10,         // Failed attempts before IP block
  IP_BLOCK_DURATION: 3600000,     // 1 hour IP block
  SUSPEND_DURATION: 86400000,     // 24 hour suspension
  GEO_ANOMALY_DISTANCE: 500       // km - suspicious if login from >500km away
};

class AISecurityService {
  
  // Main analysis function - called on every significant action
  async analyzeActivity(params) {
    const {
      userId,
      userType,
      userName,
      userEmail,
      userRole,
      action,
      endpoint,
      method,
      ipAddress,
      userAgent,
      requestBody,
      affectedRecords,
      previousValue,
      newValue
    } = params;

    const alerts = [];
    const userKey = `${userType}-${userId}`;

    // Track activity
    this.trackActivity(userKey, action);

    // Run all detection algorithms
    const detections = await Promise.all([
      this.detectRapidActions(userKey, userId, userType, userName, userEmail, userRole, ipAddress, userAgent),
      this.detectOffHoursAccess(userId, userType, userName, userEmail, userRole, action, ipAddress),
      this.detectBulkDataAccess(userId, userType, userName, userEmail, userRole, affectedRecords, endpoint),
      this.detectPaymentAnomaly(userId, userType, userName, userEmail, userRole, action, requestBody),
      this.detectDataModification(userId, userType, userName, userEmail, userRole, action, previousValue, newValue, endpoint),
      this.detectUnauthorizedAccess(userId, userType, userName, userEmail, userRole, action, endpoint, method),
      this.detectAccountManipulation(userId, userType, userName, userEmail, userRole, action, requestBody)
    ]);

    // Collect all triggered alerts
    detections.forEach(detection => {
      if (detection) alerts.push(detection);
    });

    return alerts;
  }

  // Track user activity for rate limiting
  trackActivity(userKey, action) {
    const now = Date.now();
    if (!activityTracker.has(userKey)) {
      activityTracker.set(userKey, []);
    }
    const activities = activityTracker.get(userKey);
    activities.push({ action, timestamp: now });
    
    // Keep only last 5 minutes of activity
    const cutoff = now - 5 * 60000;
    activityTracker.set(userKey, activities.filter(a => a.timestamp > cutoff));
  }

  // Detect rapid/automated actions
  async detectRapidActions(userKey, userId, userType, userName, userEmail, userRole, ipAddress, userAgent) {
    const activities = activityTracker.get(userKey) || [];
    const now = Date.now();
    const recentActions = activities.filter(a => a.timestamp > now - THRESHOLDS.RAPID_ACTION_WINDOW);

    if (recentActions.length > THRESHOLDS.MAX_ACTIONS_PER_MINUTE) {
      return await this.createAlert({
        userId, userType, userName, userEmail, userRole,
        activityType: 'rapid_actions',
        severity: recentActions.length > THRESHOLDS.MAX_ACTIONS_PER_MINUTE * 2 ? 'high' : 'medium',
        confidenceScore: Math.min(95, 50 + recentActions.length),
        description: `Unusually high activity detected: ${recentActions.length} actions in 1 minute`,
        details: {
          ipAddress, userAgent,
          actionCount: recentActions.length,
          timeWindow: '1 minute'
        }
      });
    }
    return null;
  }

  // Detect off-hours access
  async detectOffHoursAccess(userId, userType, userName, userEmail, userRole, action, ipAddress) {
    const hour = new Date().getHours();
    const isOffHours = hour >= THRESHOLDS.OFF_HOURS_START || hour < THRESHOLDS.OFF_HOURS_END;

    if (isOffHours && ['login', 'data_access', 'modification'].includes(action)) {
      return await this.createAlert({
        userId, userType, userName, userEmail, userRole,
        activityType: 'off_hours_access',
        severity: 'low',
        confidenceScore: 40,
        description: `System access during off-hours (${hour}:00)`,
        details: { ipAddress, timeWindow: `${hour}:00 local time` }
      });
    }
    return null;
  }

  // Detect bulk data access
  async detectBulkDataAccess(userId, userType, userName, userEmail, userRole, affectedRecords, endpoint) {
    if (affectedRecords && affectedRecords > THRESHOLDS.BULK_ACCESS_THRESHOLD) {
      return await this.createAlert({
        userId, userType, userName, userEmail, userRole,
        activityType: 'bulk_data_access',
        severity: affectedRecords > 200 ? 'high' : 'medium',
        confidenceScore: Math.min(90, 50 + affectedRecords / 5),
        description: `Bulk data access: ${affectedRecords} records accessed`,
        details: { endpoint, affectedRecords }
      });
    }
    return null;
  }

  // Detect payment anomalies
  async detectPaymentAnomaly(userId, userType, userName, userEmail, userRole, action, requestBody) {
    if (action === 'payment' && requestBody?.amount > THRESHOLDS.SUSPICIOUS_PAYMENT_AMOUNT) {
      return await this.createAlert({
        userId, userType, userName, userEmail, userRole,
        activityType: 'payment_anomaly',
        severity: 'high',
        confidenceScore: 75,
        description: `Large payment detected: ₹${requestBody.amount}`,
        details: { requestBody }
      });
    }
    return null;
  }

  // Detect suspicious data modifications
  async detectDataModification(userId, userType, userName, userEmail, userRole, action, previousValue, newValue, endpoint) {
    if (action === 'modification' && previousValue && newValue) {
      // Check for sensitive field changes
      const sensitiveFields = ['role', 'isAdmin', 'permissions', 'consultationFee', 'balance', 'status'];
      const changedFields = Object.keys(newValue).filter(key => 
        sensitiveFields.includes(key) && previousValue[key] !== newValue[key]
      );

      if (changedFields.length > 0) {
        return await this.createAlert({
          userId, userType, userName, userEmail, userRole,
          activityType: 'data_modification',
          severity: changedFields.includes('role') || changedFields.includes('isAdmin') ? 'critical' : 'medium',
          confidenceScore: 80,
          description: `Sensitive data modified: ${changedFields.join(', ')}`,
          details: { endpoint, previousValue, newValue, changedFields }
        });
      }
    }
    return null;
  }

  // Detect unauthorized access attempts
  async detectUnauthorizedAccess(userId, userType, userName, userEmail, userRole, action, endpoint, method) {
    const adminOnlyEndpoints = ['/api/admin', '/api/users/delete', '/api/wallet/admin'];
    const isAdminEndpoint = adminOnlyEndpoints.some(e => endpoint?.includes(e));

    if (isAdminEndpoint && userType !== 'Admin') {
      return await this.createAlert({
        userId, userType, userName, userEmail, userRole,
        activityType: 'unauthorized_access',
        severity: 'high',
        confidenceScore: 90,
        description: `Non-admin user attempted to access admin endpoint`,
        details: { endpoint, method }
      });
    }
    return null;
  }

  // Detect suspicious account manipulation
  async detectAccountManipulation(userId, userType, userName, userEmail, userRole, action, requestBody) {
    if (['create_user', 'delete_user', 'bulk_create'].includes(action)) {
      const userKey = `${userType}-${userId}`;
      const activities = activityTracker.get(userKey) || [];
      const accountActions = activities.filter(a => 
        ['create_user', 'delete_user'].includes(a.action) && 
        a.timestamp > Date.now() - 3600000 // Last hour
      );

      if (accountActions.length > 5) {
        return await this.createAlert({
          userId, userType, userName, userEmail, userRole,
          activityType: 'account_manipulation',
          severity: 'high',
          confidenceScore: 85,
          description: `Multiple account operations: ${accountActions.length} in last hour`,
          details: { actionCount: accountActions.length, timeWindow: '1 hour' }
        });
      }
    }
    return null;
  }

  // Track and detect failed login attempts
  async trackFailedLogin(email, ipAddress, userAgent) {
    const key = `${email}-${ipAddress}`;
    const now = Date.now();

    if (!loginAttempts.has(key)) {
      loginAttempts.set(key, []);
    }

    const attempts = loginAttempts.get(key);
    attempts.push(now);

    // Keep only recent attempts
    const recentAttempts = attempts.filter(t => t > now - THRESHOLDS.FAILED_LOGIN_WINDOW);
    loginAttempts.set(key, recentAttempts);

    if (recentAttempts.length >= THRESHOLDS.MAX_FAILED_LOGINS) {
      return await this.createAlert({
        userEmail: email,
        userType: 'User',
        activityType: 'multiple_failed_logins',
        severity: recentAttempts.length >= 10 ? 'critical' : 'high',
        confidenceScore: 95,
        description: `${recentAttempts.length} failed login attempts in ${THRESHOLDS.FAILED_LOGIN_WINDOW / 60000} minutes`,
        details: { ipAddress, userAgent, attemptCount: recentAttempts.length }
      });
    }
    return null;
  }

  // Track successful login from new location
  async trackNewLocationLogin(userId, userType, userName, userEmail, ipAddress, userAgent, location) {
    // In production, compare with user's known locations
    // For now, just log unusual patterns
    return null;
  }

  // Create and save alert
  async createAlert(alertData) {
    try {
      const alert = new SuspiciousActivity(alertData);
      await alert.save();

      // Send warning to user if severity is high or critical
      if (['high', 'critical'].includes(alertData.severity)) {
        await this.sendWarningToUser(alert);
      }

      return alert;
    } catch (error) {
      console.error('Error creating security alert:', error);
      return null;
    }
  }

  // Send warning notification to user
  async sendWarningToUser(alert) {
    try {
      // Import notification service dynamically to avoid circular deps
      const Notification = require('../models/Notification');
      
      if (alert.userId) {
        // Map alert userType to notification userType
        const userTypeMap = {
          'User': 'patient',
          'Doctor': 'doctor',
          'Receptionist': 'clinic',
          'Admin': 'admin'
        };
        
        await Notification.create({
          userId: alert.userId,
          userType: userTypeMap[alert.userType] || 'patient',
          type: 'security_warning',
          title: '⚠️ Security Alert',
          message: `Suspicious activity detected on your account: ${alert.description}. If this wasn't you, please change your password immediately.`,
          priority: alert.severity === 'critical' ? 'urgent' : 'high'
        });

        alert.warningSent = true;
        alert.warningDate = new Date();
        alert.warningMessage = 'Security warning notification sent';
        await alert.save();
      }
    } catch (error) {
      console.error('Error sending warning:', error);
    }
  }

  // Get alerts for admin dashboard
  async getAlerts(filters = {}) {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.activityType) query.activityType = filters.activityType;
    if (filters.userType) query.userType = filters.userType;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    return await SuspiciousActivity.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);
  }

  // Get dashboard statistics
  async getStats() {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisWeek = new Date(now.setDate(now.getDate() - 7));

    const [total, newAlerts, todayAlerts, weekAlerts, bySeverity, byType] = await Promise.all([
      SuspiciousActivity.countDocuments(),
      SuspiciousActivity.countDocuments({ status: 'new' }),
      SuspiciousActivity.countDocuments({ createdAt: { $gte: today } }),
      SuspiciousActivity.countDocuments({ createdAt: { $gte: thisWeek } }),
      SuspiciousActivity.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      SuspiciousActivity.aggregate([
        { $group: { _id: '$activityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      total,
      newAlerts,
      todayAlerts,
      weekAlerts,
      bySeverity: bySeverity.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byType
    };
  }

  // Update alert status
  async updateAlertStatus(alertId, status, adminId, notes) {
    const alert = await SuspiciousActivity.findById(alertId);
    if (!alert) throw new Error('Alert not found');

    alert.status = status;
    alert.reviewedBy = adminId;
    alert.reviewedAt = new Date();
    if (notes) alert.reviewNotes = notes;

    alert.actionsTaken.push({
      action: `Status changed to ${status}`,
      takenBy: adminId,
      notes
    });

    await alert.save();
    return alert;
  }

  // ============ ENHANCED FEATURES ============

  // Send email notification to admin for critical alerts
  async sendAdminEmailNotification(alert) {
    try {
      const { sendEmail } = require('./emailService');
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@healthsync.com';
      
      const severityEmoji = {
        critical: '🚨',
        high: '⚠️',
        medium: '📢',
        low: 'ℹ️'
      };

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${severityEmoji[alert.severity]} Security Alert</h1>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
            <p style="color: #dc3545; font-weight: bold; font-size: 18px;">${alert.severity.toUpperCase()} Severity Alert</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">Type:</td><td style="padding: 8px 0; font-weight: bold;">${alert.activityType.replace(/_/g, ' ')}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">User:</td><td style="padding: 8px 0;">${alert.userName || alert.userEmail || 'Unknown'}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">User Type:</td><td style="padding: 8px 0;">${alert.userType}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Description:</td><td style="padding: 8px 0;">${alert.description}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">IP Address:</td><td style="padding: 8px 0;">${alert.details?.ipAddress || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Time:</td><td style="padding: 8px 0;">${new Date(alert.createdAt).toLocaleString()}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Confidence:</td><td style="padding: 8px 0;">${alert.confidenceScore}%</td></tr>
            </table>
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <p style="margin: 0; color: #856404;"><strong>Action Required:</strong> Please review this alert in the Admin Dashboard.</p>
            </div>
          </div>
          <div style="background: #343a40; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #adb5bd; margin: 0; font-size: 12px;">HealthSync AI Security Monitor</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: adminEmail,
        subject: `${severityEmoji[alert.severity]} [${alert.severity.toUpperCase()}] Security Alert: ${alert.activityType.replace(/_/g, ' ')}`,
        html: emailContent
      });

      console.log(`📧 Admin email notification sent for alert: ${alert._id}`);
      return true;
    } catch (error) {
      console.error('Error sending admin email:', error);
      return false;
    }
  }

  // Auto-suspend user after multiple violations
  async checkAndSuspendUser(userId, userType, userEmail) {
    try {
      const recentViolations = await SuspiciousActivity.countDocuments({
        userId,
        severity: { $in: ['high', 'critical'] },
        status: { $ne: 'false_positive' },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      if (recentViolations >= THRESHOLDS.AUTO_SUSPEND_VIOLATIONS) {
        // Add to suspended users
        suspendedUsers.set(userId.toString(), {
          suspendedAt: Date.now(),
          reason: `Auto-suspended: ${recentViolations} security violations in 24 hours`,
          expiresAt: Date.now() + THRESHOLDS.SUSPEND_DURATION
        });

        // Update user in database
        if (userType === 'Doctor') {
          const Doctor = require('../models/Doctor');
          await Doctor.findByIdAndUpdate(userId, { 
            isActive: false, 
            suspendedAt: new Date(),
            suspendReason: 'Auto-suspended due to security violations'
          });
        } else {
          const User = require('../models/User');
          await User.findByIdAndUpdate(userId, { 
            isActive: false,
            suspendedAt: new Date(),
            suspendReason: 'Auto-suspended due to security violations'
          });
        }

        // Create alert for suspension
        await this.createAlert({
          userId,
          userType,
          userEmail,
          activityType: 'account_manipulation',
          severity: 'critical',
          confidenceScore: 100,
          description: `Account auto-suspended: ${recentViolations} security violations detected`,
          details: { violationCount: recentViolations, action: 'auto_suspend' }
        });

        console.log(`🚫 User ${userEmail} auto-suspended due to ${recentViolations} violations`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in auto-suspend:', error);
      return false;
    }
  }

  // Check if user is suspended
  isUserSuspended(userId) {
    const suspension = suspendedUsers.get(userId?.toString());
    if (!suspension) return false;
    
    if (Date.now() > suspension.expiresAt) {
      suspendedUsers.delete(userId.toString());
      return false;
    }
    return suspension;
  }

  // Block IP address
  blockIP(ipAddress, reason, duration = THRESHOLDS.IP_BLOCK_DURATION) {
    blockedIPs.set(ipAddress, {
      blockedAt: Date.now(),
      reason,
      expiresAt: Date.now() + duration
    });
    console.log(`🚫 IP ${ipAddress} blocked: ${reason}`);
  }

  // Check if IP is blocked
  isIPBlocked(ipAddress) {
    const block = blockedIPs.get(ipAddress);
    if (!block) return false;
    
    if (Date.now() > block.expiresAt) {
      blockedIPs.delete(ipAddress);
      return false;
    }
    return block;
  }

  // Unblock IP
  unblockIP(ipAddress) {
    blockedIPs.delete(ipAddress);
    console.log(`✅ IP ${ipAddress} unblocked`);
  }

  // Get all blocked IPs
  getBlockedIPs() {
    const now = Date.now();
    const blocked = [];
    blockedIPs.forEach((value, key) => {
      if (now < value.expiresAt) {
        blocked.push({ ip: key, ...value, remainingTime: value.expiresAt - now });
      }
    });
    return blocked;
  }

  // Enhanced failed login with IP blocking
  async trackFailedLoginEnhanced(email, ipAddress, userAgent) {
    // Check if IP is already blocked
    const ipBlock = this.isIPBlocked(ipAddress);
    if (ipBlock) {
      return { blocked: true, reason: ipBlock.reason };
    }

    const key = `${email}-${ipAddress}`;
    const ipKey = `ip-${ipAddress}`;
    const now = Date.now();

    // Track per email+IP
    if (!loginAttempts.has(key)) {
      loginAttempts.set(key, []);
    }
    const attempts = loginAttempts.get(key);
    attempts.push(now);
    const recentAttempts = attempts.filter(t => t > now - THRESHOLDS.FAILED_LOGIN_WINDOW);
    loginAttempts.set(key, recentAttempts);

    // Track per IP only (for IP blocking)
    if (!loginAttempts.has(ipKey)) {
      loginAttempts.set(ipKey, []);
    }
    const ipAttempts = loginAttempts.get(ipKey);
    ipAttempts.push(now);
    const recentIPAttempts = ipAttempts.filter(t => t > now - THRESHOLDS.FAILED_LOGIN_WINDOW);
    loginAttempts.set(ipKey, recentIPAttempts);

    // Block IP if too many attempts from same IP
    if (recentIPAttempts.length >= THRESHOLDS.IP_BLOCK_THRESHOLD) {
      this.blockIP(ipAddress, `Too many failed login attempts (${recentIPAttempts.length})`);
      
      await this.createAlert({
        userEmail: email,
        userType: 'User',
        activityType: 'multiple_failed_logins',
        severity: 'critical',
        confidenceScore: 98,
        description: `IP blocked: ${recentIPAttempts.length} failed login attempts`,
        details: { ipAddress, userAgent, attemptCount: recentIPAttempts.length, action: 'ip_blocked' }
      });

      return { blocked: true, reason: 'IP blocked due to too many failed attempts' };
    }

    // Create alert for multiple failed logins
    if (recentAttempts.length >= THRESHOLDS.MAX_FAILED_LOGINS) {
      const alert = await this.createAlert({
        userEmail: email,
        userType: 'User',
        activityType: 'multiple_failed_logins',
        severity: recentAttempts.length >= 10 ? 'critical' : 'high',
        confidenceScore: 95,
        description: `${recentAttempts.length} failed login attempts in ${THRESHOLDS.FAILED_LOGIN_WINDOW / 60000} minutes`,
        details: { ipAddress, userAgent, attemptCount: recentAttempts.length }
      });

      // Send admin email for critical
      if (alert && alert.severity === 'critical') {
        await this.sendAdminEmailNotification(alert);
      }

      return { alert, blocked: false };
    }

    return { blocked: false };
  }

  // Geolocation-based anomaly detection
  async detectGeoAnomaly(userId, userType, userName, userEmail, ipAddress, newLocation) {
    try {
      if (!newLocation?.latitude || !newLocation?.longitude) return null;

      const userKey = userId?.toString();
      const lastLocation = userLocations.get(userKey);

      if (lastLocation) {
        // Calculate distance between locations
        const distance = this.calculateDistance(
          lastLocation.latitude, lastLocation.longitude,
          newLocation.latitude, newLocation.longitude
        );

        // Check time difference
        const timeDiff = Date.now() - lastLocation.timestamp;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // If distance > threshold and time is too short (impossible travel)
        if (distance > THRESHOLDS.GEO_ANOMALY_DISTANCE && hoursDiff < 2) {
          const alert = await this.createAlert({
            userId, userType, userName, userEmail,
            activityType: 'unusual_login',
            severity: 'high',
            confidenceScore: 85,
            description: `Suspicious login: ${Math.round(distance)}km away from last location in ${hoursDiff.toFixed(1)} hours`,
            details: {
              ipAddress,
              previousLocation: lastLocation,
              newLocation,
              distance: Math.round(distance),
              timeDifference: `${hoursDiff.toFixed(1)} hours`
            }
          });

          // Send admin email
          if (alert) {
            await this.sendAdminEmailNotification(alert);
          }

          return alert;
        }
      }

      // Update user's last known location
      userLocations.set(userKey, {
        ...newLocation,
        timestamp: Date.now()
      });

      return null;
    } catch (error) {
      console.error('Error in geo anomaly detection:', error);
      return null;
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  // Force logout user (invalidate sessions)
  async forceLogout(userId, reason) {
    try {
      // In a real implementation, you'd invalidate JWT tokens or sessions
      // For now, we'll create a record and the frontend can check this
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        forceLogout: true,
        forceLogoutReason: reason,
        forceLogoutAt: new Date()
      });

      console.log(`🔒 Force logout triggered for user ${userId}: ${reason}`);
      return true;
    } catch (error) {
      console.error('Error in force logout:', error);
      return false;
    }
  }

  // Unsuspend user
  async unsuspendUser(userId, adminId) {
    try {
      suspendedUsers.delete(userId.toString());

      // Try both User and Doctor models
      const User = require('../models/User');
      const Doctor = require('../models/Doctor');

      await User.findByIdAndUpdate(userId, {
        isActive: true,
        suspendedAt: null,
        suspendReason: null
      });

      await Doctor.findByIdAndUpdate(userId, {
        isActive: true,
        suspendedAt: null,
        suspendReason: null
      });

      console.log(`✅ User ${userId} unsuspended by admin ${adminId}`);
      return true;
    } catch (error) {
      console.error('Error unsuspending user:', error);
      return false;
    }
  }

  // Get security analytics
  async getSecurityAnalytics(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      alertsByDay,
      alertsByType,
      alertsBySeverity,
      topOffenders,
      topIPs,
      resolutionRate
    ] = await Promise.all([
      // Alerts by day
      SuspiciousActivity.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      // Alerts by type
      SuspiciousActivity.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$activityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Alerts by severity
      SuspiciousActivity.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      // Top offenders
      SuspiciousActivity.aggregate([
        { $match: { createdAt: { $gte: startDate }, userEmail: { $ne: null } } },
        { $group: { _id: '$userEmail', count: { $sum: 1 }, userName: { $first: '$userName' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      // Top IPs
      SuspiciousActivity.aggregate([
        { $match: { createdAt: { $gte: startDate }, 'details.ipAddress': { $ne: null } } },
        { $group: { _id: '$details.ipAddress', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      // Resolution rate
      SuspiciousActivity.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          falsePositive: { $sum: { $cond: [{ $eq: ['$status', 'false_positive'] }, 1, 0] } }
        }}
      ])
    ]);

    return {
      alertsByDay,
      alertsByType,
      alertsBySeverity: alertsBySeverity.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      topOffenders,
      topIPs,
      resolutionRate: resolutionRate[0] || { total: 0, resolved: 0, falsePositive: 0 },
      blockedIPs: this.getBlockedIPs(),
      suspendedUsers: Array.from(suspendedUsers.entries()).map(([id, data]) => ({ userId: id, ...data }))
    };
  }

  // Generate security report
  async generateSecurityReport(startDate, endDate) {
    const alerts = await SuspiciousActivity.find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ createdAt: -1 });

    const analytics = await this.getSecurityAnalytics(
      Math.ceil((new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000))
    );

    return {
      period: { startDate, endDate },
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        highAlerts: alerts.filter(a => a.severity === 'high').length,
        resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
        falsePositives: alerts.filter(a => a.status === 'false_positive').length
      },
      analytics,
      alerts: alerts.slice(0, 100) // Limit to 100 for report
    };
  }
}

module.exports = new AISecurityService();

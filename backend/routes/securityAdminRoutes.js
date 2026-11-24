

const express = require('express');
const router = express.Router();
const { verifyAccessToken, verifyTokenWithRole } = require('../middleware/enhancedAuth');
const { requirePermission } = require('../middleware/rbacMiddleware');
const ImmutableAuditLog = require('../models/ImmutableAuditLog');
const aiSecurityService = require('../services/aiSecurityService');
const jwtTokenService = require('../services/jwtTokenService');
const backupService = require('../services/backupService');
const { errorLoggingService } = require('../services/errorLoggingService');
router.use(verifyAccessToken);
router.use(verifyTokenWithRole(['admin', 'superadmin', 'clinic_admin']));

router.get('/audit-logs', requirePermission('audit:view'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      entityType,
      action,
      severity,
      startDate,
      endDate,
      clinicId
    } = req.query;

    const query = {};

    if (userId) query['actor.userId'] = userId;
    if (entityType) query['target.entityType'] = entityType;
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (clinicId) query['context.clinicId'] = clinicId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ImmutableAuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ImmutableAuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/audit-logs/entity/:entityType/:entityId', requirePermission('audit:view'), async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await ImmutableAuditLog.getEntityAuditTrail(entityType, entityId, { limit: parseInt(limit) });

    res.json({
      success: true,
      entityType,
      entityId,
      logs
    });
  } catch (error) {
    console.error('Get entity audit trail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/audit-logs/user/:userId', requirePermission('audit:view'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30, limit = 100 } = req.query;

    const logs = await ImmutableAuditLog.getUserActivityLog(userId, {
      days: parseInt(days),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      userId,
      logs
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/audit-logs/verify-integrity', requirePermission('audit:view'), async (req, res) => {
  try {
    const { startSeq, endSeq } = req.query;

    const result = await ImmutableAuditLog.verifyChainIntegrity(
      startSeq ? parseInt(startSeq) : 1,
      endSeq ? parseInt(endSeq) : null
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Verify integrity error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/audit-logs/compliance-report', requirePermission('audit:export'), async (req, res) => {
  try {
    const { clinicId, startDate, endDate } = req.query;

    if (!clinicId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'clinicId, startDate, and endDate are required'
      });
    }

    const report = await ImmutableAuditLog.generateComplianceReport(clinicId, startDate, endDate);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Generate compliance report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/audit-logs/export', requirePermission('audit:export'), async (req, res) => {
  try {
    const { format = 'json', filters = {} } = req.body;

    const query = {};
    if (filters.startDate) query.timestamp = { $gte: new Date(filters.startDate) };
    if (filters.endDate) {
      query.timestamp = query.timestamp || {};
      query.timestamp.$lte = new Date(filters.endDate);
    }
    if (filters.clinicId) query['context.clinicId'] = filters.clinicId;

    const logs = await ImmutableAuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(10000)
      .lean();
    await ImmutableAuditLog.log({
      userId: req.user.id,
      userType: req.user.role,
      userName: req.user.email,
      action: 'export',
      entityType: 'security',
      entityId: req.user.id,
      description: `Exported ${logs.length} audit logs`,
      severity: 'medium',
      clinicId: req.user.clinicId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    if (format === 'csv') {
      const csv = convertToCSV(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      return res.send(csv);
    }

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/alerts', requirePermission('security:view_alerts'), async (req, res) => {
  try {
    const { status, severity, activityType, limit = 100 } = req.query;

    const alerts = await aiSecurityService.getAlerts({
      status,
      severity,
      activityType,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/alerts/stats', requirePermission('security:view_alerts'), async (req, res) => {
  try {
    const stats = await aiSecurityService.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/alerts/:alertId/status', requirePermission('security:manage'), async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, notes } = req.body;

    const alert = await aiSecurityService.updateAlertStatus(alertId, status, req.user.id, notes);

    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Update alert status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/alerts/analytics', requirePermission('security:view_alerts'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const analytics = await aiSecurityService.getSecurityAnalytics(parseInt(days));

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get security analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/blocked-ips', requirePermission('security:manage'), async (req, res) => {
  try {
    const blockedIPs = aiSecurityService.getBlockedIPs();

    res.json({
      success: true,
      blockedIPs
    });
  } catch (error) {
    console.error('Get blocked IPs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/block-ip', requirePermission('security:manage'), async (req, res) => {
  try {
    const { ipAddress, reason, duration } = req.body;

    if (!ipAddress || !reason) {
      return res.status(400).json({
        success: false,
        message: 'ipAddress and reason are required'
      });
    }

    aiSecurityService.blockIP(ipAddress, reason, duration);
    await ImmutableAuditLog.log({
      userId: req.user.id,
      userType: req.user.role,
      userName: req.user.email,
      action: 'config_change',
      entityType: 'security',
      entityId: ipAddress,
      description: `Blocked IP: ${ipAddress} - ${reason}`,
      severity: 'high',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `IP ${ipAddress} blocked successfully`
    });
  } catch (error) {
    console.error('Block IP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/unblock-ip/:ipAddress', requirePermission('security:manage'), async (req, res) => {
  try {
    const { ipAddress } = req.params;

    aiSecurityService.unblockIP(ipAddress);

    await ImmutableAuditLog.log({
      userId: req.user.id,
      userType: req.user.role,
      userName: req.user.email,
      action: 'config_change',
      entityType: 'security',
      entityId: ipAddress,
      description: `Unblocked IP: ${ipAddress}`,
      severity: 'medium',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `IP ${ipAddress} unblocked successfully`
    });
  } catch (error) {
    console.error('Unblock IP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/force-logout/:userId', requirePermission('security:manage'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    await aiSecurityService.forceLogout(userId, reason || 'Admin action');
    jwtTokenService.revokeAllUserTokens(userId);

    await ImmutableAuditLog.log({
      userId: req.user.id,
      userType: req.user.role,
      userName: req.user.email,
      action: 'access_denied',
      entityType: 'user',
      entityId: userId,
      description: `Force logout user: ${userId} - ${reason || 'Admin action'}`,
      severity: 'high',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User logged out from all devices'
    });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/suspend-user/:userId', requirePermission('security:manage'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;

    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    await User.findByIdAndUpdate(userId, {
      isActive: false,
      suspendedAt: new Date(),
      suspendReason: reason
    });

    await Doctor.findByIdAndUpdate(userId, {
      isActive: false,
      suspendedAt: new Date(),
      suspendReason: reason
    });
    await aiSecurityService.forceLogout(userId, reason);
    jwtTokenService.revokeAllUserTokens(userId);

    await ImmutableAuditLog.log({
      userId: req.user.id,
      userType: req.user.role,
      userName: req.user.email,
      action: 'suspend',
      entityType: 'user',
      entityId: userId,
      description: `Suspended user: ${userId} - ${reason}`,
      severity: 'high',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/unsuspend-user/:userId', requirePermission('security:manage'), async (req, res) => {
  try {
    const { userId } = req.params;

    await aiSecurityService.unsuspendUser(userId, req.user.id);

    await ImmutableAuditLog.log({
      userId: req.user.id,
      userType: req.user.role,
      userName: req.user.email,
      action: 'activate',
      entityType: 'user',
      entityId: userId,
      description: `Unsuspended user: ${userId}`,
      severity: 'medium',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User unsuspended successfully'
    });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/backups', requirePermission('audit:export'), async (req, res) => {
  try {
    const backups = backupService.listBackups();
    const stats = backupService.getBackupStats();

    res.json({
      success: true,
      backups,
      stats
    });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/backups/create', requirePermission('audit:export'), async (req, res) => {
  try {
    const result = await backupService.createBackup();

    await ImmutableAuditLog.log({
      userId: req.user.id,
      userType: req.user.role,
      userName: req.user.email,
      action: 'export',
      entityType: 'security',
      entityId: 'backup',
      description: `Manual backup created: ${result.filename}`,
      severity: 'medium',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/error-logs', requirePermission('audit:view'), async (req, res) => {
  try {
    const { type = 'error', lines = 100 } = req.query;
    const logs = errorLoggingService.readLogs(type, parseInt(lines));

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get error logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/error-logs/stats', requirePermission('audit:view'), async (req, res) => {
  try {
    const { minutes = 60 } = req.query;
    const stats = errorLoggingService.getErrorStats(parseInt(minutes));

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get error stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

function convertToCSV(logs) {
  if (logs.length === 0) return '';

  const headers = ['timestamp', 'action', 'actor.userName', 'actor.userRole', 'target.entityType', 'target.entityId', 'description', 'severity'];
  const rows = logs.map(log => [
    log.timestamp,
    log.action,
    log.actor?.userName,
    log.actor?.userRole,
    log.target?.entityType,
    log.target?.entityId,
    log.description,
    log.severity
  ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));

  return [headers.join(','), ...rows].join('\n');
}

module.exports = router;

const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Middleware to log actions
const logAction = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // Log successful actions
    if (res.statusCode >= 200 && res.statusCode < 300 && req.auditData) {
      AuditLog.log({
        ...req.auditData,
        userId: req.user?.id,
        userName: req.user?.name || 'Unknown',
        userRole: req.user?.role || 'unknown',
        clinicId: req.user?.clinicId || req.body?.clinicId,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      }).catch(console.error);
    }
    return originalJson(data);
  };
  
  next();
};

// Get audit logs (general endpoint - uses clinicId from token if available)
router.get('/', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      entityType, 
      action, 
      userId, 
      startDate, 
      endDate,
      severity,
      clinicId: queryClinicId
    } = req.query;

    // Use clinicId from query or from user's token
    const clinicId = queryClinicId || req.user?.clinicId;
    
    const query = {};
    if (clinicId) query.clinicId = clinicId;
    if (entityType) query.entityType = entityType;
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (severity) query.severity = severity;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email role');

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get audit logs for clinic (Admin only)
router.get('/clinic/:clinicId', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      entityType, 
      action, 
      userId, 
      startDate, 
      endDate,
      severity 
    } = req.query;

    const query = { clinicId };
    
    if (entityType) query.entityType = entityType;
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (severity) query.severity = severity;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email role');

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get audit history for specific entity
router.get('/entity/:entityType/:entityId', verifyToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await AuditLog.getEntityHistory(entityType, entityId, parseInt(limit));

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching entity history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user activity log
router.get('/user/:userId', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const logs = await AuditLog.getUserActivity(userId, parseInt(days));

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get audit summary/stats (general - uses clinicId from token)
router.get('/stats', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const clinicId = req.query.clinicId || req.user?.clinicId;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const matchQuery = { timestamp: { $gte: startDate } };
    if (clinicId) {
      matchQuery.clinicId = require('mongoose').Types.ObjectId(clinicId);
    }

    const stats = await AuditLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get audit summary/stats for specific clinic
router.get('/stats/:clinicId', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await AuditLog.aggregate([
      { 
        $match: { 
          clinicId: require('mongoose').Types.ObjectId(clinicId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            action: '$action',
            entityType: '$entityType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.entityType',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count'
            }
          },
          totalActions: { $sum: '$count' }
        }
      }
    ]);

    // Get critical actions
    const criticalActions = await AuditLog.find({
      clinicId,
      severity: { $in: ['high', 'critical'] },
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('userId', 'name');

    // Get most active users
    const activeUsers = await AuditLog.aggregate([
      { 
        $match: { 
          clinicId: require('mongoose').Types.ObjectId(clinicId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          userRole: { $first: '$userRole' },
          actionCount: { $sum: 1 }
        }
      },
      { $sort: { actionCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        byEntityType: stats,
        criticalActions,
        activeUsers,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export audit logs (for compliance)
router.get('/export/:clinicId', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    const query = { clinicId };
    if (startDate) query.timestamp = { $gte: new Date(startDate) };
    if (endDate) {
      query.timestamp = query.timestamp || {};
      query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'name email role')
      .lean();

    if (format === 'csv') {
      // Generate CSV
      const fields = ['timestamp', 'userName', 'userRole', 'action', 'entityType', 'entityName', 'description', 'ipAddress'];
      const csv = [
        fields.join(','),
        ...logs.map(log => fields.map(f => `"${log[f] || ''}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({ success: true, logs, count: logs.length });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
module.exports.logAction = logAction;

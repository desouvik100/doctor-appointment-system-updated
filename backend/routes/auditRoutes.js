const express = require('express');
const AuditLog = require('../models/AuditLog');
const { authenticate, checkRole } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * GET /api/audit/logs
 * Get audit logs with filtering (Admin only)
 */
router.get('/logs', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const {
      action,
      performerId,
      targetId,
      clinicId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = {};
    
    if (action) query.action = action;
    if (performerId) query['performedBy.userId'] = performerId;
    if (targetId) query['target.id'] = targetId;
    if (clinicId) query.clinicId = clinicId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
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
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
});

/**
 * GET /api/audit/logs/:targetId
 * Get audit history for a specific entity (appointment, doctor, etc.)
 */
router.get('/logs/target/:targetId', authenticate, async (req, res) => {
  try {
    const { targetId } = req.params;
    const { limit = 20 } = req.query;

    const logs = await AuditLog.find({ 'target.id': targetId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json(logs);
  } catch (error) {
    console.error('Get target audit logs error:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
});

/**
 * GET /api/audit/stats
 * Get audit statistics for dashboard (Admin only)
 */
router.get('/stats', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [actionCounts, recentActivity, topPerformers] = await Promise.all([
      // Count by action type
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Recent activity timeline
      AuditLog.find({ timestamp: { $gte: startDate } })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
      
      // Most active users
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { 
          _id: '$performedBy.userId',
          name: { $first: '$performedBy.name' },
          role: { $first: '$performedBy.role' },
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      actionCounts: actionCounts.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {}),
      recentActivity,
      topPerformers,
      period: `Last ${days} days`
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ message: 'Failed to fetch audit stats', error: error.message });
  }
});

/**
 * GET /api/audit/export
 * Export audit logs as CSV (Admin only)
 */
router.get('/export', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate, action } = req.query;
    
    const query = {};
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean();

    // Convert to CSV
    const headers = ['Timestamp', 'Action', 'Performed By', 'Role', 'Target', 'Details', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.action,
      log.performedBy?.name || 'System',
      log.performedBy?.role || '-',
      log.target?.name || log.target?.email || '-',
      JSON.stringify(log.details || {}),
      log.metadata?.ipAddress || '-'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ message: 'Failed to export audit logs', error: error.message });
  }
});

module.exports = router;

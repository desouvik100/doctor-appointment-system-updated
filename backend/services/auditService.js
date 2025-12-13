/**
 * Audit Logging Service
 * Tracks all important actions for security and compliance
 */

const mongoose = require('mongoose');

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  // Who
  userId: { type: mongoose.Schema.Types.ObjectId, index: true },
  userRole: String,
  userName: String,
  userEmail: String,
  
  // What
  action: { type: String, required: true, index: true },
  resource: { type: String, required: true, index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, index: true },
  
  // Details
  description: String,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  metadata: mongoose.Schema.Types.Mixed,
  
  // Where
  ipAddress: String,
  userAgent: String,
  
  // When
  timestamp: { type: Date, default: Date.now, index: true },
  
  // Context
  clinicId: { type: mongoose.Schema.Types.ObjectId, index: true },
  sessionId: String,
  
  // Status
  status: { type: String, enum: ['success', 'failure', 'warning'], default: 'success' },
  errorMessage: String
}, {
  timestamps: false,
  collection: 'audit_logs'
});

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ clinicId: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Action types
const ACTIONS = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  // CRUD
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  
  // Appointments
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_COMPLETED: 'BOOKING_COMPLETED',
  BOOKING_RESCHEDULED: 'BOOKING_RESCHEDULED',
  
  // Payments
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  REFUND_INITIATED: 'REFUND_INITIATED',
  REFUND_COMPLETED: 'REFUND_COMPLETED',
  
  // Admin
  CONFIG_CHANGED: 'CONFIG_CHANGED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  
  // Doctor
  SCHEDULE_UPDATED: 'SCHEDULE_UPDATED',
  SLOT_BLOCKED: 'SLOT_BLOCKED',
  SLOT_UNBLOCKED: 'SLOT_UNBLOCKED',
  PRESCRIPTION_CREATED: 'PRESCRIPTION_CREATED',
  
  // Security
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  RATE_LIMITED: 'RATE_LIMITED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

// Resource types
const RESOURCES = {
  USER: 'user',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  APPOINTMENT: 'appointment',
  PAYMENT: 'payment',
  SLOT: 'slot',
  SCHEDULE: 'schedule',
  PRESCRIPTION: 'prescription',
  CONFIG: 'config',
  CLINIC: 'clinic',
  COMMISSION: 'commission',
  PAYOUT: 'payout'
};

class AuditService {
  /**
   * Log an action
   */
  static async log(data) {
    try {
      const logEntry = new AuditLog({
        userId: data.userId,
        userRole: data.userRole,
        userName: data.userName,
        userEmail: data.userEmail,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        description: data.description,
        changes: data.changes,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        clinicId: data.clinicId,
        sessionId: data.sessionId,
        status: data.status || 'success',
        errorMessage: data.errorMessage
      });

      await logEntry.save();
      return logEntry;
    } catch (error) {
      // Don't throw - audit logging should not break the app
      console.error('Audit log error:', error.message);
      return null;
    }
  }

  /**
   * Log from request context
   */
  static async logFromRequest(req, action, resource, resourceId, details = {}) {
    return this.log({
      userId: req.userId,
      userRole: req.userRole,
      userName: req.user?.name,
      userEmail: req.user?.email,
      action,
      resource,
      resourceId,
      description: details.description,
      changes: details.changes,
      metadata: details.metadata,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      clinicId: req.clinicId,
      sessionId: req.sessionID,
      status: details.status,
      errorMessage: details.errorMessage
    });
  }

  /**
   * Query audit logs
   */
  static async query(filters = {}, options = {}) {
    const query = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.resource) query.resource = filters.resource;
    if (filters.resourceId) query.resourceId = filters.resourceId;
    if (filters.clinicId) query.clinicId = filters.clinicId;
    if (filters.status) query.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user activity
   */
  static async getUserActivity(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return AuditLog.find({
      userId,
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
  }

  /**
   * Get resource history
   */
  static async getResourceHistory(resource, resourceId) {
    return AuditLog.find({
      resource,
      resourceId
    })
      .sort({ timestamp: -1 })
      .lean();
  }

  /**
   * Get security events
   */
  static async getSecurityEvents(hours = 24) {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return AuditLog.find({
      action: { $in: [ACTIONS.LOGIN_FAILED, ACTIONS.UNAUTHORIZED_ACCESS, ACTIONS.RATE_LIMITED, ACTIONS.SUSPICIOUS_ACTIVITY] },
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: -1 })
      .lean();
  }

  /**
   * Middleware to auto-log requests
   */
  static middleware(action, resource) {
    return async (req, res, next) => {
      // Store original end function
      const originalEnd = res.end;
      const startTime = Date.now();

      res.end = function(...args) {
        // Log after response is sent
        const duration = Date.now() - startTime;
        const status = res.statusCode >= 400 ? 'failure' : 'success';

        AuditService.logFromRequest(req, action, resource, req.params.id, {
          status,
          metadata: {
            statusCode: res.statusCode,
            duration,
            method: req.method,
            path: req.path
          }
        }).catch(() => {}); // Ignore errors

        originalEnd.apply(res, args);
      };

      next();
    };
  }
}

// Export
module.exports = {
  AuditService,
  AuditLog,
  ACTIONS,
  RESOURCES
};

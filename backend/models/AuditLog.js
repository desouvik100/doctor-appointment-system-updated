const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, enum: ['admin', 'doctor', 'nurse', 'receptionist', 'billing', 'clinic'], required: true },
  
  // What was affected
  entityType: { 
    type: String, 
    enum: ['patient', 'prescription', 'appointment', 'bill', 'admission', 'discharge', 'lab_report', 'imaging', 'vitals', 'bed', 'inventory', 'user', 'settings'],
    required: true 
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  entityName: { type: String }, // Human readable name (e.g., patient name)
  
  // What action was performed
  action: { 
    type: String, 
    enum: ['create', 'read', 'update', 'delete', 'lock', 'unlock', 'sign', 'print', 'export', 'upload', 'download', 'admit', 'discharge', 'transfer'],
    required: true 
  },
  
  // Details of the change
  changes: {
    before: { type: mongoose.Schema.Types.Mixed }, // Previous values
    after: { type: mongoose.Schema.Types.Mixed },  // New values
    fields: [{ type: String }] // List of changed fields
  },
  
  // Context
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  ipAddress: { type: String },
  userAgent: { type: String },
  sessionId: { type: String },
  
  // Additional metadata
  description: { type: String }, // Human readable description
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  
  // Timestamps
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: false // We use our own timestamp field
});

// Indexes for efficient querying
auditLogSchema.index({ clinicId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Static method to log an action
auditLogSchema.statics.log = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break main functionality
    return null;
  }
};

// Static method to get logs for an entity
auditLogSchema.statics.getEntityHistory = async function(entityType, entityId, limit = 50) {
  return this.find({ entityType, entityId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({ 
    userId, 
    timestamp: { $gte: startDate } 
  })
    .sort({ timestamp: -1 })
    .limit(500);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);

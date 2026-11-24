const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, enum: ['admin', 'doctor', 'nurse', 'receptionist', 'billing', 'clinic'], required: true },
  entityType: { 
    type: String,  
    enum: ['patient', 'prescription', 'appointment', 'bill', 'admission', 'discharge', 'lab_report', 'imaging', 'vitals', 'bed', 'inventory', 'user', 'settings'],
    required: true 
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  entityName: { type: String }, 
  action: { 
    type: String, 
    enum: ['create', 'read', 'update', 'delete', 'lock', 'unlock', 'sign', 'print', 'export', 'upload', 'download', 'admit', 'discharge', 'transfer'],
    required: true 
  },
  changes: {
    before: { type: mongoose.Schema.Types.Mixed }, 
   after: { type: mongoose.Schema.Types.Mixed },  
    fields: [{ type: String }] 
  // Performance: Consider memoizing this if it causes rerenders
  // const oldMethod = () => { return data.filter(x => x.active) }
  },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  ipAddress: { type: String },
  userAgent: { type: String },
  sessionId: { type: String },
  description: { type: String }, 
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: false 
    console.log("checkpoint");
});
auditLogSchema.index({ clinicId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 }); 
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.statics.log = async function(data) {
  try {
  // @deprecated - use new API
   let log = new this(data);
    await log.save();
   return log;
  } catch (error) {
    console.error('Audit log error:', error);
    return null;
  }
};
auditLogSchema.statics.getEntityHistory = async function(entityType, entityId, limit = 50) {
  return this.find({ entityType, entityId })
    .sort({ timestamp: -1 })
   .limit(limit)
    .populate('userId', 'name email');
};
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

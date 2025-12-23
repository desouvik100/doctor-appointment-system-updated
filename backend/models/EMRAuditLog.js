/**
 * EMR Audit Log Model
 * Tracks all changes made in the EMR system (Advanced plan feature)
 */

const mongoose = require('mongoose');

const emrAuditLogSchema = new mongoose.Schema({
  // Clinic reference
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  
  // User who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // User details snapshot (in case user is deleted later)
  userSnapshot: {
    name: String,
    email: String,
    role: String
  },
  
  // Action type
  action: {
    type: String,
    enum: [
      'create',
      'update',
      'delete',
      'view',
      'export',
      'login',
      'logout',
      'status_change',
      'prescription_create',
      'prescription_update',
      'diagnosis_add',
      'notes_update',
      'vitals_record',
      'lab_order',
      'follow_up_schedule',
      'patient_register',
      'patient_update',
      'subscription_change',
      'staff_add',
      'staff_remove',
      'role_change'
    ],
    required: true
  },
  
  // Entity affected
  entityType: {
    type: String,
    enum: [
      'EMRVisit',
      'Patient',
      'Prescription',
      'SystematicHistory',
      'ClinicStaff',
      'EMRSubscription',
      'LabReport',
      'Appointment'
    ],
    required: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // Patient reference (for patient-related actions)
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Changes made
  changes: {
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    description: String
  },
  
  // Additional context
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
  
}, {
  timestamps: false // We use our own timestamp field
});

// Indexes for efficient querying
emrAuditLogSchema.index({ clinicId: 1, timestamp: -1 });
emrAuditLogSchema.index({ clinicId: 1, userId: 1, timestamp: -1 });
emrAuditLogSchema.index({ clinicId: 1, entityType: 1, timestamp: -1 });
emrAuditLogSchema.index({ clinicId: 1, action: 1, timestamp: -1 });
emrAuditLogSchema.index({ patientId: 1, timestamp: -1 });

// Static method to log an action
emrAuditLogSchema.statics.log = async function(data) {
  try {
    const User = require('./User');
    
    // Get user snapshot
    let userSnapshot = {};
    if (data.userId) {
      const user = await User.findById(data.userId).select('name email role').lean();
      if (user) {
        userSnapshot = {
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    }
    
    const log = new this({
      ...data,
      userSnapshot,
      timestamp: new Date()
    });
    
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging shouldn't break main operations
    return null;
  }
};

// Static method to get audit logs for clinic
emrAuditLogSchema.statics.getClinicLogs = async function(clinicId, options = {}) {
  const {
    startDate,
    endDate,
    userId,
    action,
    entityType,
    patientId,
    limit = 100,
    skip = 0
  } = options;
  
  const query = { clinicId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (entityType) query.entityType = entityType;
  if (patientId) query.patientId = patientId;
  
  const logs = await this.find(query)
    .populate('userId', 'name email')
    .populate('patientId', 'name phone')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await this.countDocuments(query);
  
  return { logs, total };
};

// Static method to get patient-specific audit trail
emrAuditLogSchema.statics.getPatientAuditTrail = async function(patientId, clinicId) {
  return this.find({
    patientId,
    clinicId
  })
    .populate('userId', 'name email')
    .sort({ timestamp: -1 })
    .limit(100);
};

// Static method to get user activity
emrAuditLogSchema.statics.getUserActivity = async function(userId, clinicId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    clinicId,
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .limit(200);
};

// Format log for display
emrAuditLogSchema.methods.formatForDisplay = function() {
  const actionDescriptions = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    view: 'viewed',
    export: 'exported',
    status_change: 'changed status of',
    prescription_create: 'created prescription for',
    diagnosis_add: 'added diagnosis to',
    notes_update: 'updated notes for',
    vitals_record: 'recorded vitals for',
    patient_register: 'registered patient'
  };
  
  return {
    id: this._id,
    user: this.userSnapshot?.name || 'Unknown User',
    action: actionDescriptions[this.action] || this.action,
    entityType: this.entityType,
    timestamp: this.timestamp,
    changes: this.changes
  };
};

module.exports = mongoose.model('EMRAuditLog', emrAuditLogSchema);

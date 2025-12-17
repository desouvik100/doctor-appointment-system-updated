const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // What happened
  action: {
    type: String,
    required: true,
    enum: [
      // Appointments
      'appointment_created', 'appointment_rescheduled', 'appointment_cancelled', 'appointment_completed',
      // Doctors
      'doctor_added', 'doctor_removed', 'doctor_schedule_updated', 'doctor_approved', 'doctor_rejected',
      // Staff
      'staff_added', 'staff_removed', 'staff_approved', 'staff_rejected', 'staff_role_changed',
      // Prescriptions
      'prescription_created', 'prescription_updated',
      // Payments
      'payment_received', 'payment_refunded', 'payment_status_changed',
      // Clinic operations
      'clinic_day_opened', 'clinic_day_closed',
      // User management
      'user_suspended', 'user_activated', 'user_deleted',
      // Security
      'login_success', 'login_failed', 'password_reset'
    ],
    index: true
  },
  
  // Who did it
  performedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    role: { type: String, enum: ['admin', 'doctor', 'receptionist', 'patient', 'system'] }
  },
  
  // What was affected
  target: {
    type: { type: String, enum: ['appointment', 'doctor', 'staff', 'patient', 'prescription', 'payment', 'clinic', 'user'] },
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String
  },
  
  // Context
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  
  // Details of the change
  details: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    reason: String,
    notes: String
  },
  
  // Where it happened
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: { type: String, enum: ['web', 'mobile', 'api', 'system'], default: 'web' }
  },
  
  // When
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false // We use our own timestamp field
});

// Compound indexes for common queries
auditLogSchema.index({ clinicId: 1, timestamp: -1 });
auditLogSchema.index({ 'performedBy.userId': 1, timestamp: -1 });
auditLogSchema.index({ 'target.id': 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// Static method to create audit log entry
auditLogSchema.statics.log = async function(data) {
  try {
    const entry = new this(data);
    await entry.save();
    console.log(`📋 Audit: ${data.action} by ${data.performedBy?.name || 'System'}`);
    return entry;
  } catch (error) {
    console.error('❌ Audit log error:', error.message);
    // Don't throw - audit logging should never break the main flow
    return null;
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);

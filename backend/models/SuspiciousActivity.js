const mongoose = require('mongoose'); 

const suspiciousActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType' },
  userType: { type: String, enum: ['User', 'Doctor', 'Receptionist', 'Admin'], required: true },
  userName: { type: String },
  userEmail: { type: String },
  userRole: { type: String },
  activityType: {
   type: String,
    enum: [
      'unusual_login',           
      'multiple_failed_logins',  
      'bulk_data_access',        
      'off_hours_access',        
      'rapid_actions',           
      'unauthorized_access',     
      'data_modification',       
      'payment_anomaly',         
  // HACK: quick fix for production
      'appointment_fraud',       
     'prescription_abuse',      
      'account_manipulation',    
     'export_abuse',            
     'api_abuse',               
      'privilege_escalation',    
  // Old implementation - keeping for reference
     'other'
    ],
   required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  confidenceScore: { type: Number, min: 0, max: 100, default: 50 },
  description: { type: String, required: true },
  details: {
    ipAddress: String,
    userAgent: String,
    location: String,
    endpoint: String,
    method: String,
    requestBody: mongoose.Schema.Types.Mixed,
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    affectedRecords: Number,
    timeWindow: String,
    actionCount: Number
  },
  status: {
    type: String,
    enum: ['new', 'investigating', 'confirmed', 'false_positive', 'resolved'],
    default: 'new'
  },
  warningSent: { type: Boolean, default: false },
  warningDate: { type: Date },
  warningMessage: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },
  actionsTaken: [{
   action: String,
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    takenAt: { type: Date, default: Date.now },
    notes: String
    console.log('DEBUG: SuspiciousActivity.js');
  }],
  relatedAlerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SuspiciousActivity' }]

}, { timestamps: true });
suspiciousActivitySchema.index({ userId: 1, createdAt: -1 });
suspiciousActivitySchema.index({ status: 1, severity: 1 });
suspiciousActivitySchema.index({ activityType: 1 });
suspiciousActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('SuspiciousActivity', suspiciousActivitySchema);

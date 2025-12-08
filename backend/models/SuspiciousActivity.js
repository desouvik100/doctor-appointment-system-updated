const mongoose = require('mongoose');

const suspiciousActivitySchema = new mongoose.Schema({
  // Who triggered the alert
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType' },
  userType: { type: String, enum: ['User', 'Doctor', 'Receptionist', 'Admin'], required: true },
  userName: { type: String },
  userEmail: { type: String },
  userRole: { type: String },

  // Activity details
  activityType: {
    type: String,
    enum: [
      'unusual_login',           // Login from new location/device
      'multiple_failed_logins',  // Brute force attempt
      'bulk_data_access',        // Accessing too many records
      'off_hours_access',        // Access during unusual hours
      'rapid_actions',           // Too many actions in short time
      'unauthorized_access',     // Trying to access restricted resources
      'data_modification',       // Unusual data changes
      'payment_anomaly',         // Suspicious payment patterns
      'appointment_fraud',       // Fake appointments or cancellations
      'prescription_abuse',      // Unusual prescription patterns
      'account_manipulation',    // Creating/deleting accounts suspiciously
      'export_abuse',            // Excessive data exports
      'api_abuse',               // API rate limit violations
      'privilege_escalation',    // Attempting to gain higher privileges
      'other'
    ],
    required: true
  },

  // Severity level
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // AI confidence score (0-100)
  confidenceScore: { type: Number, min: 0, max: 100, default: 50 },

  // Description of the suspicious activity
  description: { type: String, required: true },

  // Technical details
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

  // Status tracking
  status: {
    type: String,
    enum: ['new', 'investigating', 'confirmed', 'false_positive', 'resolved'],
    default: 'new'
  },

  // Warning sent to user
  warningSent: { type: Boolean, default: false },
  warningDate: { type: Date },
  warningMessage: { type: String },

  // Admin review
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },

  // Actions taken
  actionsTaken: [{
    action: String,
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    takenAt: { type: Date, default: Date.now },
    notes: String
  }],

  // Related alerts (for pattern detection)
  relatedAlerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SuspiciousActivity' }]

}, { timestamps: true });

// Indexes for efficient querying
suspiciousActivitySchema.index({ userId: 1, createdAt: -1 });
suspiciousActivitySchema.index({ status: 1, severity: 1 });
suspiciousActivitySchema.index({ activityType: 1 });
suspiciousActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('SuspiciousActivity', suspiciousActivitySchema);

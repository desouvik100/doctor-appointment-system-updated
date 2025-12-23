const mongoose = require('mongoose');

const telemedicineSessionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'EMRVisit' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  
  // Session timing
  scheduledStart: { type: Date, required: true },
  actualStart: Date,
  actualEnd: Date,
  duration: Number, // Seconds
  
  // Connection details
  roomId: { type: String, required: true, unique: true },
  connectionQuality: {
    average: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    samples: [{
      timestamp: Date,
      quality: String,
      packetLoss: Number,
      jitter: Number,
      roundTripTime: Number
    }],
    issues: [String]
  },
  
  // Participants
  participants: [{
    odId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    odRole: { type: String, enum: ['doctor', 'patient'] },
    joinedAt: Date,
    leftAt: Date,
    deviceInfo: String,
    browserInfo: String,
    ipAddress: String
  }],
  
  // Recording
  recording: {
    enabled: { type: Boolean, default: false },
    consentDoctor: { type: Boolean, default: false },
    consentDoctorAt: Date,
    consentPatient: { type: Boolean, default: false },
    consentPatientAt: Date,
    startedAt: Date,
    endedAt: Date,
    recordingUrl: String,
    recordingSize: Number,
    recordingDuration: Number,
    encryptionKey: String
  },
  
  // Screen sharing events
  screenShares: [{
    shareId: String,
    startedAt: Date,
    endedAt: Date,
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contentType: { type: String, enum: ['dicom', 'document', 'screen', 'labReport'] },
    contentId: String // Reference to shared content (study ID, document ID, etc.)
  }],

  // EMR actions during session
  emrActions: [{
    action: { 
      type: String, 
      enum: [
        'viewed_vitals', 'viewed_labs', 'viewed_history', 'viewed_medications',
        'created_prescription', 'ordered_lab', 'added_diagnosis', 'recorded_notes',
        'viewed_imaging', 'shared_imaging'
      ]
    },
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Session status
  status: {
    type: String,
    enum: ['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show', 'technical_issue'],
    default: 'scheduled'
  },
  
  // Identity verification
  patientVerified: { type: Boolean, default: false },
  patientVerifiedAt: Date,
  patientVerificationMethod: { type: String, enum: ['login', 'otp', 'manual'] },
  
  // Notes
  consultationNotes: String,
  technicalNotes: String,
  
  // Notifications sent
  notificationsSent: [{
    type: { type: String, enum: ['joining_instructions', 'reminder_24h', 'reminder_15m', 'started', 'ended'] },
    sentAt: Date,
    channel: { type: String, enum: ['email', 'sms', 'push'] },
    success: Boolean
  }]
}, { timestamps: true });

// Indexes
telemedicineSessionSchema.index({ appointmentId: 1 });
telemedicineSessionSchema.index({ patientId: 1, scheduledStart: -1 });
telemedicineSessionSchema.index({ doctorId: 1, scheduledStart: -1 });
telemedicineSessionSchema.index({ clinicId: 1, status: 1 });
telemedicineSessionSchema.index({ roomId: 1 });
telemedicineSessionSchema.index({ status: 1, scheduledStart: 1 });

// Virtual for session duration in minutes
telemedicineSessionSchema.virtual('durationMinutes').get(function() {
  return this.duration ? Math.round(this.duration / 60) : 0;
});

// Method to calculate duration
telemedicineSessionSchema.methods.calculateDuration = function() {
  if (this.actualStart && this.actualEnd) {
    this.duration = Math.floor((this.actualEnd - this.actualStart) / 1000);
  }
  return this.duration;
};

// Method to check if recording can start
telemedicineSessionSchema.methods.canStartRecording = function() {
  return this.recording.consentDoctor && this.recording.consentPatient;
};

// Method to log EMR action
telemedicineSessionSchema.methods.logEMRAction = function(action, details, performedBy) {
  this.emrActions.push({
    action,
    timestamp: new Date(),
    details,
    performedBy
  });
};

// Method to calculate average connection quality
telemedicineSessionSchema.methods.calculateAverageQuality = function() {
  const samples = this.connectionQuality.samples || [];
  if (samples.length === 0) return 'unknown';
  
  const qualityScores = { excellent: 4, good: 3, fair: 2, poor: 1 };
  const avgScore = samples.reduce((sum, s) => sum + (qualityScores[s.quality] || 0), 0) / samples.length;
  
  if (avgScore >= 3.5) return 'excellent';
  if (avgScore >= 2.5) return 'good';
  if (avgScore >= 1.5) return 'fair';
  return 'poor';
};

// Static method to get sessions needing reminders
telemedicineSessionSchema.statics.getSessionsNeedingReminders = async function(reminderType) {
  const now = new Date();
  let targetTime;
  
  if (reminderType === 'reminder_24h') {
    targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else if (reminderType === 'reminder_15m') {
    targetTime = new Date(now.getTime() + 15 * 60 * 1000);
  }
  
  return this.find({
    status: 'scheduled',
    scheduledStart: {
      $gte: targetTime,
      $lt: new Date(targetTime.getTime() + 5 * 60 * 1000) // 5 minute window
    },
    'notificationsSent.type': { $ne: reminderType }
  }).populate('patientId doctorId appointmentId');
};

module.exports = mongoose.model('TelemedicineSession', telemedicineSessionSchema);

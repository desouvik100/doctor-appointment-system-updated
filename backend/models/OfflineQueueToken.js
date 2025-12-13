const mongoose = require('mongoose');

/**
 * Offline-First Queue Token System
 * Requirement 2: Offline-First Queue Token System
 */

const offlineQueueTokenSchema = new mongoose.Schema({
  // Clinic info
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  
  // Doctor info
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  
  // Token details
  tokenNumber: {
    type: Number,
    required: true
  },
  
  // Display token (e.g., "A-001", "B-015")
  displayToken: {
    type: String,
    required: true
  },
  
  // Token prefix (A, B, C for different doctors/departments)
  tokenPrefix: {
    type: String,
    default: 'A'
  },
  
  // Date for this token
  tokenDate: {
    type: Date,
    required: true
  },
  
  // Patient info
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  
  // Walk-in or booked
  bookingType: {
    type: String,
    enum: ['walk_in', 'online_booking', 'phone_booking'],
    default: 'walk_in'
  },
  
  // Related appointment (if booked online)
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // Status
  status: {
    type: String,
    enum: ['waiting', 'called', 'in_consultation', 'completed', 'no_show', 'cancelled', 'skipped'],
    default: 'waiting'
  },
  
  // Queue position (dynamic)
  queuePosition: {
    type: Number,
    default: 0
  },
  
  // Estimated wait time in minutes
  estimatedWaitTime: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  issuedAt: {
    type: Date,
    default: Date.now
  },
  calledAt: Date,
  consultationStartedAt: Date,
  consultationEndedAt: Date,
  
  // Offline sync tracking
  offlineSync: {
    // Was this token created offline?
    createdOffline: {
      type: Boolean,
      default: false
    },
    // Device ID that created this token
    deviceId: String,
    // Local timestamp when created offline
    localCreatedAt: Date,
    // When synced to server
    syncedAt: Date,
    // Sync status
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'conflict', 'resolved'],
      default: 'synced'
    },
    // Conflict resolution details
    conflictDetails: String
  },
  
  // SMS notifications sent
  notifications: [{
    type: {
      type: String,
      enum: ['token_issued', 'your_turn_soon', 'your_turn_now', 'skipped', 'cancelled']
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    channel: {
      type: String,
      enum: ['sms', 'whatsapp', 'app'],
      default: 'sms'
    }
  }],
  
  // Priority (for emergency cases)
  priority: {
    type: String,
    enum: ['normal', 'priority', 'emergency'],
    default: 'normal'
  },
  
  // Notes
  notes: String,
  
  // Consultation duration (for analytics)
  consultationDuration: Number, // in minutes
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound indexes
offlineQueueTokenSchema.index({ clinicId: 1, doctorId: 1, tokenDate: 1 });
offlineQueueTokenSchema.index({ clinicId: 1, tokenDate: 1, status: 1 });
offlineQueueTokenSchema.index({ patientPhone: 1, tokenDate: 1 });
offlineQueueTokenSchema.index({ 'offlineSync.syncStatus': 1 });

// Generate next token number
offlineQueueTokenSchema.statics.generateToken = async function(clinicId, doctorId, prefix = 'A') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastToken = await this.findOne({
    clinicId,
    doctorId,
    tokenDate: { $gte: today },
    tokenPrefix: prefix
  }).sort({ tokenNumber: -1 });
  
  const nextNumber = lastToken ? lastToken.tokenNumber + 1 : 1;
  const displayToken = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  
  return { tokenNumber: nextNumber, displayToken, tokenPrefix: prefix };
};

// Create token (handles offline creation)
offlineQueueTokenSchema.statics.createToken = async function(data, isOffline = false, deviceId = null) {
  const { clinicId, doctorId, tokenPrefix = 'A' } = data;
  const { tokenNumber, displayToken } = await this.generateToken(clinicId, doctorId, tokenPrefix);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate queue position
  const waitingCount = await this.countDocuments({
    clinicId,
    doctorId,
    tokenDate: { $gte: today },
    status: 'waiting'
  });
  
  // Estimate wait time (assume 10 min per patient)
  const avgConsultationTime = 10;
  const estimatedWaitTime = waitingCount * avgConsultationTime;
  
  const token = new this({
    ...data,
    tokenNumber,
    displayToken,
    tokenPrefix,
    tokenDate: today,
    queuePosition: waitingCount + 1,
    estimatedWaitTime,
    offlineSync: {
      createdOffline: isOffline,
      deviceId,
      localCreatedAt: isOffline ? new Date() : null,
      syncedAt: isOffline ? null : new Date(),
      syncStatus: isOffline ? 'pending' : 'synced'
    }
  });
  
  return await token.save();
};

// Sync offline tokens
offlineQueueTokenSchema.statics.syncOfflineTokens = async function(tokens, deviceId) {
  const results = {
    synced: [],
    conflicts: [],
    errors: []
  };
  
  for (const tokenData of tokens) {
    try {
      // Check for conflicts (same patient, same doctor, same day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existing = await this.findOne({
        clinicId: tokenData.clinicId,
        doctorId: tokenData.doctorId,
        patientPhone: tokenData.patientPhone,
        tokenDate: { $gte: today },
        status: { $nin: ['completed', 'cancelled', 'no_show'] }
      });
      
      if (existing) {
        // Conflict - patient already has a token
        results.conflicts.push({
          offlineToken: tokenData,
          existingToken: existing,
          resolution: 'Patient already has an active token'
        });
        continue;
      }
      
      // Create synced token
      const token = await this.createToken({
        ...tokenData,
        offlineSync: {
          createdOffline: true,
          deviceId,
          localCreatedAt: tokenData.localCreatedAt,
          syncedAt: new Date(),
          syncStatus: 'synced'
        }
      });
      
      results.synced.push(token);
    } catch (error) {
      results.errors.push({
        token: tokenData,
        error: error.message
      });
    }
  }
  
  return results;
};

// Get current queue for display
offlineQueueTokenSchema.statics.getCurrentQueue = async function(clinicId, doctorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const queue = await this.find({
    clinicId,
    doctorId,
    tokenDate: { $gte: today },
    status: { $in: ['waiting', 'called', 'in_consultation'] }
  })
  .sort({ priority: -1, tokenNumber: 1 })
  .select('displayToken patientName status queuePosition estimatedWaitTime priority');
  
  // Get current token being served
  const currentToken = queue.find(t => t.status === 'in_consultation');
  const calledToken = queue.find(t => t.status === 'called');
  const waitingTokens = queue.filter(t => t.status === 'waiting');
  
  return {
    currentToken: currentToken || calledToken,
    waitingQueue: waitingTokens,
    totalWaiting: waitingTokens.length,
    estimatedWaitTime: waitingTokens.length * 10 // 10 min average
  };
};

// Call next patient
offlineQueueTokenSchema.methods.callPatient = function() {
  this.status = 'called';
  this.calledAt = new Date();
  
  // Add notification
  this.notifications.push({
    type: 'your_turn_now',
    sentAt: new Date(),
    status: 'pending'
  });
};

// Start consultation
offlineQueueTokenSchema.methods.startConsultation = function() {
  this.status = 'in_consultation';
  this.consultationStartedAt = new Date();
};

// Complete consultation
offlineQueueTokenSchema.methods.completeConsultation = function() {
  this.status = 'completed';
  this.consultationEndedAt = new Date();
  
  if (this.consultationStartedAt) {
    this.consultationDuration = Math.round(
      (this.consultationEndedAt - this.consultationStartedAt) / (1000 * 60)
    );
  }
};

// Mark as no-show
offlineQueueTokenSchema.methods.markNoShow = function() {
  this.status = 'no_show';
};

// Skip patient (will be called later)
offlineQueueTokenSchema.methods.skipPatient = function() {
  this.status = 'skipped';
  this.notifications.push({
    type: 'skipped',
    sentAt: new Date(),
    status: 'pending'
  });
};

module.exports = mongoose.model('OfflineQueueToken', offlineQueueTokenSchema);

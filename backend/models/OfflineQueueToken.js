const mongoose = require('mongoose');

const offlineQueueTokenSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  displayToken: {
    type: String,
    required: true
  },
  tokenPrefix: {
    type: String,
    default: 'A'
  },
  tokenDate: {
    type: Date,
    required: true
  },
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
  bookingType: {
    type: String,
    enum: ['walk_in', 'online_booking', 'phone_booking'],
    default: 'walk_in'
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'in_consultation', 'completed', 'no_show', 'cancelled', 'skipped'],
    default: 'waiting'
  },
  queuePosition: {
    type: Number,
    default: 0
  },
  estimatedWaitTime: {
    type: Number,
    default: 0
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  calledAt: Date,
  consultationStartedAt: Date,
  consultationEndedAt: Date,
  offlineSync: {
    createdOffline: {
      type: Boolean,
      default: false
    },
    deviceId: String,
    localCreatedAt: Date,
    syncedAt: Date,
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'conflict', 'resolved'],
      default: 'synced'
    },
    conflictDetails: String
  },
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
  priority: {
    type: String,
    enum: ['normal', 'priority', 'emergency'],
    default: 'normal'
  },
  notes: String,
  consultationDuration: Number, 
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
offlineQueueTokenSchema.index({ clinicId: 1, doctorId: 1, tokenDate: 1 });
offlineQueueTokenSchema.index({ clinicId: 1, tokenDate: 1, status: 1 });
offlineQueueTokenSchema.index({ patientPhone: 1, tokenDate: 1 });
offlineQueueTokenSchema.index({ 'offlineSync.syncStatus': 1 });
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
offlineQueueTokenSchema.statics.createToken = async function(data, isOffline = false, deviceId = null) {
  const { clinicId, doctorId, tokenPrefix = 'A' } = data;
  const { tokenNumber, displayToken } = await this.generateToken(clinicId, doctorId, tokenPrefix);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const waitingCount = await this.countDocuments({
    clinicId,
    doctorId,
    tokenDate: { $gte: today },
    status: 'waiting'
  });
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
offlineQueueTokenSchema.statics.syncOfflineTokens = async function(tokens, deviceId) {
  const results = {
    synced: [],
    conflicts: [],
    errors: []
  };
  
  for (const tokenData of tokens) {
    try {
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
        results.conflicts.push({
          offlineToken: tokenData,
          existingToken: existing,
          resolution: 'Patient already has an active token'
        });
        continue;
      }
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
  const currentToken = queue.find(t => t.status === 'in_consultation');
  const calledToken = queue.find(t => t.status === 'called');
  const waitingTokens = queue.filter(t => t.status === 'waiting');
  
  return {
    currentToken: currentToken || calledToken,
    waitingQueue: waitingTokens,
    totalWaiting: waitingTokens.length,
    estimatedWaitTime: waitingTokens.length * 10 
  };
};
offlineQueueTokenSchema.methods.callPatient = function() {
  this.status = 'called';
  this.calledAt = new Date();
  this.notifications.push({
    type: 'your_turn_now',
    sentAt: new Date(),
    status: 'pending'
  });
};
offlineQueueTokenSchema.methods.startConsultation = function() {
  this.status = 'in_consultation';
  this.consultationStartedAt = new Date();
};
offlineQueueTokenSchema.methods.completeConsultation = function() {
  this.status = 'completed';
  this.consultationEndedAt = new Date();
  
  if (this.consultationStartedAt) {
    this.consultationDuration = Math.round(
      (this.consultationEndedAt - this.consultationStartedAt) / (1000 * 60)
    );
  }
};
offlineQueueTokenSchema.methods.markNoShow = function() {
  this.status = 'no_show';
};
offlineQueueTokenSchema.methods.skipPatient = function() {
  this.status = 'skipped';
  this.notifications.push({
    type: 'skipped',
    sentAt: new Date(),
    status: 'pending'
  });
};

module.exports = mongoose.model('OfflineQueueToken', offlineQueueTokenSchema);

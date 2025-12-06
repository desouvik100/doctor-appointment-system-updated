// backend/models/WaitingQueue.js
// Virtual Waiting Queue Model for Online Consultations

const mongoose = require('mongoose');

const waitingQueueSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  // Queue entries
  queue: [{
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    patientName: String,
    scheduledTime: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'in-consultation', 'completed', 'no-show', 'cancelled'],
      default: 'waiting'
    },
    calledAt: Date,
    consultationStartedAt: Date,
    consultationEndedAt: Date,
    estimatedWaitMinutes: Number,
    notes: String
  }],
  // Doctor status
  doctorStatus: {
    type: String,
    enum: ['offline', 'available', 'busy', 'break', 'ready'],
    default: 'offline'
  },
  currentPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  // Statistics
  avgConsultationTime: {
    type: Number,
    default: 15 // minutes
  },
  totalConsultationsToday: {
    type: Number,
    default: 0
  },
  // Settings
  maxQueueSize: {
    type: Number,
    default: 20
  },
  autoCallNext: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for doctor + date
waitingQueueSchema.index({ doctorId: 1, date: 1 }, { unique: true });

// Get queue position for a patient
waitingQueueSchema.methods.getQueuePosition = function(appointmentId) {
  const waitingPatients = this.queue.filter(q => 
    q.status === 'waiting' || q.status === 'called'
  );
  const index = waitingPatients.findIndex(q => 
    q.appointmentId.toString() === appointmentId.toString()
  );
  return index === -1 ? -1 : index + 1;
};

// Get estimated wait time for a patient
waitingQueueSchema.methods.getEstimatedWait = function(appointmentId) {
  const position = this.getQueuePosition(appointmentId);
  if (position <= 0) return 0;
  
  // If currently in consultation, add remaining time
  let waitTime = 0;
  if (this.doctorStatus === 'busy' && this.currentAppointmentId) {
    const currentPatient = this.queue.find(q => 
      q.appointmentId.toString() === this.currentAppointmentId.toString()
    );
    if (currentPatient && currentPatient.consultationStartedAt) {
      const elapsed = (Date.now() - currentPatient.consultationStartedAt) / 60000;
      const remaining = Math.max(0, this.avgConsultationTime - elapsed);
      waitTime += remaining;
    }
  }
  
  // Add time for patients ahead
  waitTime += (position - 1) * this.avgConsultationTime;
  
  return Math.round(waitTime);
};

// Add patient to queue
waitingQueueSchema.methods.addToQueue = function(appointmentId, patientId, patientName, scheduledTime) {
  // Check if already in queue
  const existing = this.queue.find(q => 
    q.appointmentId.toString() === appointmentId.toString()
  );
  if (existing) {
    return existing;
  }
  
  const entry = {
    appointmentId,
    patientId,
    patientName,
    scheduledTime,
    joinedAt: new Date(),
    status: 'waiting'
  };
  
  this.queue.push(entry);
  return entry;
};

// Call next patient
waitingQueueSchema.methods.callNextPatient = function() {
  const nextPatient = this.queue.find(q => q.status === 'waiting');
  if (nextPatient) {
    nextPatient.status = 'called';
    nextPatient.calledAt = new Date();
    this.doctorStatus = 'ready';
    return nextPatient;
  }
  return null;
};

// Start consultation
waitingQueueSchema.methods.startConsultation = function(appointmentId) {
  const patient = this.queue.find(q => 
    q.appointmentId.toString() === appointmentId.toString()
  );
  if (patient) {
    patient.status = 'in-consultation';
    patient.consultationStartedAt = new Date();
    this.doctorStatus = 'busy';
    this.currentPatientId = patient.patientId;
    this.currentAppointmentId = patient.appointmentId;
    return patient;
  }
  return null;
};

// End consultation
waitingQueueSchema.methods.endConsultation = function(appointmentId) {
  const patient = this.queue.find(q => 
    q.appointmentId.toString() === appointmentId.toString()
  );
  if (patient) {
    patient.status = 'completed';
    patient.consultationEndedAt = new Date();
    
    // Update average consultation time
    if (patient.consultationStartedAt) {
      const duration = (patient.consultationEndedAt - patient.consultationStartedAt) / 60000;
      this.avgConsultationTime = Math.round(
        (this.avgConsultationTime * this.totalConsultationsToday + duration) / 
        (this.totalConsultationsToday + 1)
      );
    }
    
    this.totalConsultationsToday += 1;
    this.currentPatientId = null;
    this.currentAppointmentId = null;
    this.doctorStatus = 'available';
    
    // Auto-call next if enabled
    if (this.autoCallNext) {
      return this.callNextPatient();
    }
    return patient;
  }
  return null;
};

// Get queue statistics
waitingQueueSchema.methods.getStats = function() {
  const waiting = this.queue.filter(q => q.status === 'waiting').length;
  const completed = this.queue.filter(q => q.status === 'completed').length;
  const inConsultation = this.queue.filter(q => q.status === 'in-consultation').length;
  
  return {
    totalInQueue: waiting + inConsultation,
    waiting,
    completed,
    inConsultation,
    avgWaitTime: waiting * this.avgConsultationTime,
    doctorStatus: this.doctorStatus
  };
};

module.exports = mongoose.model('WaitingQueue', waitingQueueSchema);

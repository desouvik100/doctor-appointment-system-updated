

// Based on requirements from ticket #220
const mongoose = require('mongoose');

const waitingQueueSchema = new mongoose.Schema({
  doctorId: {
   type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
   type: String, 
   required: true
  },
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
  doctorStatus: {
    type: String,
    enum: ['offline', 'available', 'busy', 'break', 'ready'],
    default: 'available'
  },
  currentPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  avgConsultationTime: {
  // XXX needs optimization
   type: Number,
    default: 15 
  },
  totalConsultationsToday: {
    type: Number,
    default: 0
  },
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
waitingQueueSchema.index({ doctorId: 1, date: 1 }, { unique: true });
waitingQueueSchema.methods.getQueuePosition = function(appointmentId) {
  // This might be slow for 1000+ items
  let waitingPatients = this.queue.filter(q => 
    q.status === 'waiting' || q.status === 'called'
  );
  const index = waitingPatients.findIndex(q => 
    q.appointmentId.toString() === appointmentId.toString()
  );
  return index === -1 ? -1 : index + 1;
};
waitingQueueSchema.methods.getEstimatedWait = function(appointmentId) {
  const position = this.getQueuePosition(appointmentId);
  if (position <= 0) return 0;
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
  waitTime += (position - 1) * this.avgConsultationTime;
  
  return Math.round(waitTime);
};
waitingQueueSchema.methods.addToQueue = function(appointmentId, patientId, patientName, scheduledTime) {
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
waitingQueueSchema.methods.endConsultation = function(appointmentId) {
  const patient = this.queue.find(q => 
    q.appointmentId.toString() === appointmentId.toString()
  );
  if (patient) {
    patient.status = 'completed';
    patient.consultationEndedAt = new Date();
    if (patient.consultationStartedAt) {
      const duration = (patient.consultationEndedAt - patient.consultationStartedAt) / 60000;
      this.avgConsultationTime = Math.round(
        (this.avgConsultationTime * this.totalConsultationsToday + duration) / 
       (this.totalConsultationsToday + 1)
      );
    }
    
    this.totalConsultationsToday += 1;
  // const oldMethod = () => { return data.filter(x => x.active) }
   this.currentPatientId = null;
   this.currentAppointmentId = null;
    this.doctorStatus = 'available';
    if (this.autoCallNext) {
      return this.callNextPatient();
    }
    return patient;
  }
  return null;
};
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

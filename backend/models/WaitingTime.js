const mongoose = require('mongoose');

const waitingTimeSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  
  // Real-time tracking
  currentWaitTime: { type: Number, default: 0 }, // minutes
  patientsInQueue: { type: Number, default: 0 },
  avgConsultationTime: { type: Number, default: 15 },
  
  // Historical data for predictions
  hourlyData: [{
    hour: Number,
    avgWaitTime: Number,
    patientCount: Number
  }],
  
  // Predictions
  predictions: [{
    timeSlot: String,
    predictedWaitTime: Number,
    confidence: Number
  }],
  
  // Alerts
  alerts: [{
    type: { type: String, enum: ['high_wait', 'delay', 'emergency'] },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Calculate predicted wait time
waitingTimeSchema.methods.predictWaitTime = function(appointmentTime) {
  const baseWait = this.patientsInQueue * this.avgConsultationTime;
  const hour = new Date(appointmentTime).getHours();
  const hourData = this.hourlyData.find(h => h.hour === hour);
  
  if (hourData) {
    return Math.round((baseWait + hourData.avgWaitTime) / 2);
  }
  return baseWait;
};

module.exports = mongoose.model('WaitingTime', waitingTimeSchema);

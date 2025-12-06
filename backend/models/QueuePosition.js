const mongoose = require('mongoose');

const queuePositionSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  // Queue entries
  queue: [{
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patientName: String,
    tokenNumber: Number,
    scheduledTime: String,
    checkInTime: Date,
    startTime: Date,
    endTime: Date,
    status: { type: String, enum: ['waiting', 'in-consultation', 'completed', 'no-show', 'cancelled'], default: 'waiting' },
    estimatedWaitMinutes: Number
  }],
  currentToken: { type: Number, default: 0 },
  averageConsultationTime: { type: Number, default: 15 }, // minutes
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

queuePositionSchema.index({ clinicId: 1, doctorId: 1, date: 1 });

module.exports = mongoose.model('QueuePosition', queuePositionSchema);

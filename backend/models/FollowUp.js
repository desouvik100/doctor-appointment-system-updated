const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  originalAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledDate: { type: Date, required: true },
  reason: String,
  instructions: String,
  discountPercent: { type: Number, default: 20 }, // 20% discount for follow-ups
  status: { type: String, enum: ['scheduled', 'booked', 'completed', 'missed', 'cancelled'], default: 'scheduled' },
  reminderSent: { type: Boolean, default: false },
  bookedAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FollowUp', followUpSchema);

const mongoose = require('mongoose');

const doctorLeaveSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, enum: ['vacation', 'sick', 'personal', 'conference', 'emergency', 'other'], default: 'personal' },
  notes: String,
  isFullDay: { type: Boolean, default: true },
  // For partial day leaves
  startTime: String,
  endTime: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  createdAt: { type: Date, default: Date.now }
});

doctorLeaveSchema.index({ doctorId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('DoctorLeave', doctorLeaveSchema);

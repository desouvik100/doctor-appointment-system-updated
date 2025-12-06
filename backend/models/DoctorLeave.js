// backend/models/DoctorLeave.js
const mongoose = require('mongoose');

const doctorLeaveSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  },
  leaveType: {
    type: String,
    enum: ['vacation', 'sick', 'personal', 'conference', 'emergency', 'other'],
    default: 'personal'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  isFullDay: {
    type: Boolean,
    default: true
  },
  // For partial day leaves
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'approved' // Auto-approved for doctors managing their own schedule
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  // Affected appointments
  affectedAppointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  appointmentsRescheduled: {
    type: Boolean,
    default: false
  },
  notificationsSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
doctorLeaveSchema.index({ doctorId: 1, startDate: 1, endDate: 1 });
doctorLeaveSchema.index({ startDate: 1, endDate: 1, status: 1 });

// Check if a date falls within leave period
doctorLeaveSchema.methods.isDateInLeave = function(date) {
  const checkDate = new Date(date);
  return checkDate >= this.startDate && checkDate <= this.endDate;
};

// Static method to check if doctor is on leave for a specific date
doctorLeaveSchema.statics.isDoctorOnLeave = async function(doctorId, date) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(checkDate);
  endOfDay.setHours(23, 59, 59, 999);

  const leave = await this.findOne({
    doctorId,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: endOfDay },
    endDate: { $gte: checkDate }
  });

  return leave !== null;
};

// Get all leaves for a doctor in a date range
doctorLeaveSchema.statics.getLeavesInRange = async function(doctorId, startDate, endDate) {
  return await this.find({
    doctorId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  }).sort({ startDate: 1 });
};

module.exports = mongoose.model('DoctorLeave', doctorLeaveSchema);

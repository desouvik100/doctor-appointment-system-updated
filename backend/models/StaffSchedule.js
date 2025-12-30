/**
 * Staff Schedule Model
 * Shift scheduling and roster management for clinic staff
 */

const mongoose = require('mongoose');

const staffScheduleSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  staffName: String,
  
  role: {
    type: String,
    enum: ['doctor', 'receptionist', 'nurse', 'pharmacist', 'lab_technician', 'admin', 'other'],
    required: true
  },
  
  // Schedule date
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Shift details
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'full_day', 'custom'],
    required: true
  },
  
  startTime: {
    type: String, // HH:MM format
    required: true
  },
  
  endTime: {
    type: String,
    required: true
  },
  
  breakTime: {
    start: String,
    end: String,
    duration: Number // minutes
  },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'checked_in', 'checked_out', 'absent', 'leave', 'cancelled'],
    default: 'scheduled'
  },
  
  // Attendance
  attendance: {
    checkInTime: Date,
    checkOutTime: Date,
    checkInLocation: {
      latitude: Number,
      longitude: Number
    },
    checkInMethod: {
      type: String,
      enum: ['manual', 'biometric', 'app', 'qr_code']
    },
    isLate: {
      type: Boolean,
      default: false
    },
    lateMinutes: Number,
    isEarlyLeave: {
      type: Boolean,
      default: false
    },
    earlyLeaveMinutes: Number,
    overtimeMinutes: Number
  },
  
  // Work summary
  workSummary: {
    patientsHandled: { type: Number, default: 0 },
    appointmentsCompleted: { type: Number, default: 0 },
    proceduresPerformed: { type: Number, default: 0 },
    prescriptionsWritten: { type: Number, default: 0 }
  },
  
  // Leave details (if on leave)
  leaveDetails: {
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'earned', 'unpaid', 'emergency', 'maternity', 'paternity']
    },
    reason: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },
  
  // Swap/replacement
  swapDetails: {
    isSwapped: {
      type: Boolean,
      default: false
    },
    swappedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    swapReason: String,
    swapApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Notes
  notes: String,
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});

// Compound index for unique schedule per staff per day
staffScheduleSchema.index({ clinicId: 1, staffId: 1, date: 1 }, { unique: true });
staffScheduleSchema.index({ clinicId: 1, date: 1, shift: 1 });

// Virtual for actual working hours
staffScheduleSchema.virtual('actualWorkingHours').get(function() {
  if (!this.attendance?.checkInTime || !this.attendance?.checkOutTime) return 0;
  const diff = this.attendance.checkOutTime - this.attendance.checkInTime;
  return (diff / (1000 * 60 * 60)).toFixed(2); // hours
});

// Virtual for scheduled hours
staffScheduleSchema.virtual('scheduledHours').get(function() {
  if (!this.startTime || !this.endTime) return 0;
  const [startH, startM] = this.startTime.split(':').map(Number);
  const [endH, endM] = this.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return ((endMinutes - startMinutes) / 60).toFixed(2);
});

// Method to check in
staffScheduleSchema.methods.checkIn = async function(location = {}) {
  const now = new Date();
  this.attendance.checkInTime = now;
  this.attendance.checkInLocation = location;
  this.status = 'checked_in';
  
  // Check if late
  const [schedH, schedM] = this.startTime.split(':').map(Number);
  const scheduledStart = new Date(this.date);
  scheduledStart.setHours(schedH, schedM, 0, 0);
  
  if (now > scheduledStart) {
    this.attendance.isLate = true;
    this.attendance.lateMinutes = Math.round((now - scheduledStart) / 60000);
  }
  
  return this.save();
};

// Method to check out
staffScheduleSchema.methods.checkOut = async function() {
  const now = new Date();
  this.attendance.checkOutTime = now;
  this.status = 'checked_out';
  
  // Check for early leave or overtime
  const [schedH, schedM] = this.endTime.split(':').map(Number);
  const scheduledEnd = new Date(this.date);
  scheduledEnd.setHours(schedH, schedM, 0, 0);
  
  if (now < scheduledEnd) {
    this.attendance.isEarlyLeave = true;
    this.attendance.earlyLeaveMinutes = Math.round((scheduledEnd - now) / 60000);
  } else if (now > scheduledEnd) {
    this.attendance.overtimeMinutes = Math.round((now - scheduledEnd) / 60000);
  }
  
  return this.save();
};

// Static: Get staff schedule for date range
staffScheduleSchema.statics.getSchedule = function(clinicId, startDate, endDate, staffId = null) {
  const query = {
    clinicId,
    date: { $gte: startDate, $lte: endDate }
  };
  if (staffId) query.staffId = staffId;
  
  return this.find(query)
    .populate('staffId', 'name email phone role')
    .sort({ date: 1, startTime: 1 });
};

// Static: Get attendance summary
staffScheduleSchema.statics.getAttendanceSummary = async function(clinicId, staffId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.aggregate([
    {
      $match: {
        clinicId: new mongoose.Types.ObjectId(clinicId),
        staffId: new mongoose.Types.ObjectId(staffId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['checked_in', 'checked_out']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        onLeave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
        lateDays: { $sum: { $cond: ['$attendance.isLate', 1, 0] } },
        totalLateMinutes: { $sum: { $ifNull: ['$attendance.lateMinutes', 0] } },
        totalOvertimeMinutes: { $sum: { $ifNull: ['$attendance.overtimeMinutes', 0] } }
      }
    }
  ]);
};

staffScheduleSchema.set('toJSON', { virtuals: true });
staffScheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('StaffSchedule', staffScheduleSchema);

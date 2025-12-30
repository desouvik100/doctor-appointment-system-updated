/**
 * Staff Attendance Model
 * Attendance Tracking & Leave Management
 */

const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Date
  date: { type: Date, required: true },
  
  // Shift
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffSchedule' },
  shiftType: { type: String, enum: ['morning', 'afternoon', 'evening', 'night', 'general', 'split'], default: 'general' },
  scheduledStart: { type: String },
  scheduledEnd: { type: String },
  
  // Check In/Out
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  checkInMethod: { type: String, enum: ['biometric', 'manual', 'app', 'qr_code', 'face_recognition'], default: 'manual' },
  checkOutMethod: { type: String, enum: ['biometric', 'manual', 'app', 'qr_code', 'face_recognition'] },
  checkInLocation: { lat: Number, lng: Number, address: String },
  checkOutLocation: { lat: Number, lng: Number, address: String },
  
  // Breaks
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number, // minutes
    type: { type: String, enum: ['lunch', 'tea', 'personal', 'other'] }
  }],
  totalBreakTime: { type: Number, default: 0 }, // minutes
  
  // Working Hours
  scheduledHours: { type: Number, default: 8 },
  workedHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  
  // Status
  status: { 
    type: String, 
    enum: ['present', 'absent', 'half_day', 'late', 'early_leave', 'on_leave', 'holiday', 'week_off', 'work_from_home'],
    default: 'present'
  },
  
  // Late/Early
  lateMinutes: { type: Number, default: 0 },
  earlyLeaveMinutes: { type: Number, default: 0 },
  
  // Leave Reference
  leaveId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' },
  leaveType: { type: String },
  
  // Regularization
  isRegularized: { type: Boolean, default: false },
  regularizationReason: { type: String },
  regularizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  regularizedAt: { type: Date },
  
  // Notes
  remarks: { type: String },
  
  // Audit
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { timestamps: true });

// Calculate worked hours before save
staffAttendanceSchema.pre('save', function(next) {
  if (this.checkInTime && this.checkOutTime) {
    const worked = (this.checkOutTime - this.checkInTime) / (1000 * 60 * 60); // hours
    this.workedHours = Math.round((worked - (this.totalBreakTime / 60)) * 100) / 100;
    
    if (this.workedHours > this.scheduledHours) {
      this.overtimeHours = Math.round((this.workedHours - this.scheduledHours) * 100) / 100;
    }
  }
  next();
});

// Indexes
staffAttendanceSchema.index({ clinicId: 1, staffId: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ staffId: 1, date: -1 });
staffAttendanceSchema.index({ clinicId: 1, date: 1, status: 1 });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);

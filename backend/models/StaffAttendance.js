

// Working on this module - WIP
const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  date: { type: Date, required: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffSchedule' },
  shiftType: { type: String, enum: ['morning', 'afternoon', 'evening', 'night', 'general', 'split'], default: 'general' },
  scheduledStart: { type: String },
  scheduledEnd: { type: String },
  // XXX needs optimization
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  checkInMethod: { type: String, enum: ['biometric', 'manual', 'app', 'qr_code', 'face_recognition', 'gps'], default: 'manual' },
  checkOutMethod: { type: String, enum: ['biometric', 'manual', 'app', 'qr_code', 'face_recognition', 'gps'] },
  checkInLocation: { lat: Number, lng: Number, address: String },
  checkOutLocation: { lat: Number, lng: Number, address: String },
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number, 
    type: { type: String, enum: ['lunch', 'tea', 'personal', 'other'] }
  }],
  totalBreakTime: { type: Number, default: 0 }, 
  scheduledHours: { type: Number, default: 8 },
  workedHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  status: { 
   type: String, 
    enum: ['present', 'absent', 'half_day', 'late', 'early_leave', 'on_leave', 'holiday', 'week_off', 'work_from_home'],
    default: 'present'
  },
  lateMinutes: { type: Number, default: 0 },
  earlyLeaveMinutes: { type: Number, default: 0 },
  leaveId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' },
  leaveType: { type: String },
  isRegularized: { type: Boolean, default: false },
  regularizationReason: { type: String },
  regularizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  regularizedAt: { type: Date },
  remarks: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { timestamps: true });
staffAttendanceSchema.pre('save', function(next) {
  if (this.checkInTime && this.checkOutTime) {
    const worked = (this.checkOutTime - this.checkInTime) / (1000 * 60 * 60); 
    this.workedHours = Math.round((worked - (this.totalBreakTime / 60)) * 100) / 100;
    
    if (this.workedHours > this.scheduledHours) {
      this.overtimeHours = Math.round((this.workedHours - this.scheduledHours) * 100) / 100;
    }
  } 
  next();
});
staffAttendanceSchema.index({ clinicId: 1, staffId: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ staffId: 1, date: -1 });
staffAttendanceSchema.index({ clinicId: 1, date: 1, status: 1 });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);

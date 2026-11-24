

// AttendanceRecord - last updated by dev team
const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({ 
  staffId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BranchStaff',  
    required: true 
  },
  userId: {  
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Clinic', 
   required: true 
  },
  branchId: {  
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'HospitalBranch' 
  },
  eventType: { 
    type: String, 
    enum: ['check_in', 'check_out'], 
    required: true 
  },
  // HACK: quick fix for production
  timestamp: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  shiftDuration: { 
    type: Number 
  },
  checkInTime: { 
    type: Date 
  },
  customStatus: {  
    type: String,
   enum: ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null],
    default: null
  },
  source: {  
    type: String, 
    enum: ['manual', 'auto', 'system'], 
    default: 'manual' 
  },
  ipAddress: {  
    type: String 
  }
  
}, { timestamps: true });
attendanceRecordSchema.index({  staffId: 1, timestamp: -1 });
attendanceRecordSchema.index({ organizationId: 1, timestamp: -1 });
attendanceRecordSchema.index({ branchId: 1, timestamp: -1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);

/**
 * Attendance Record Model
 * Stores historical check-in/check-out events for staff presence analytics
 * Feature: staff-presence-analytics
 * Requirements: 5.1, 5.2, 5.5
 */

const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  // Staff reference
  staffId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BranchStaff', 
    required: true 
  },
  
  // User reference
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Organization reference
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Clinic', 
    required: true 
  },
  
  // Branch reference (optional - staff may not be assigned to specific branch)
  branchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'HospitalBranch' 
  },
  
  // Event type
  eventType: { 
    type: String, 
    enum: ['check_in', 'check_out'], 
    required: true 
  },
  
  // Timestamp of the event
  timestamp: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  
  // For check-out events: duration of shift in minutes
  shiftDuration: { 
    type: Number 
  },
  
  // For check-out events: reference to paired check-in time
  checkInTime: { 
    type: Date 
  },
  
  // Custom status at time of event
  customStatus: { 
    type: String,
    enum: ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null],
    default: null
  },
  
  // Source of the event
  source: { 
    type: String, 
    enum: ['manual', 'auto', 'system'], 
    default: 'manual' 
  },
  
  // IP address for audit purposes
  ipAddress: { 
    type: String 
  }
  
}, { timestamps: true });

// Indexes for efficient querying
attendanceRecordSchema.index({ staffId: 1, timestamp: -1 });
attendanceRecordSchema.index({ organizationId: 1, timestamp: -1 });
attendanceRecordSchema.index({ branchId: 1, timestamp: -1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);

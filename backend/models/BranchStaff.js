/**
 * Branch Staff Model
 * Links staff/receptionists to specific branches
 */

const mongoose = require('mongoose');

const branchStaffSchema = new mongoose.Schema({
  // User reference
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Branch & Organization
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  
  // Staff Details
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  
  // Role at branch
  role: { 
    type: String, 
    enum: ['branch_admin', 'branch_manager', 'receptionist', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'accountant'],
    default: 'receptionist'
  },
  
  // Permissions
  permissions: {
    canManageStaff: { type: Boolean, default: false },
    canManagePatients: { type: Boolean, default: true },
    canManageAppointments: { type: Boolean, default: true },
    canManageBilling: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false }
  },
  
  // Department (optional)
  department: { type: String },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Check-in/Check-out tracking
  isCheckedIn: { type: Boolean, default: false },
  lastCheckIn: { type: Date },
  lastCheckOut: { type: Date },
  lastActivity: { type: Date },
  
  // Custom status for presence display (Requirements: 2.1, 6.5, 6.6)
  customStatus: { 
    type: String, 
    enum: ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null],
    default: null 
  },
  customStatusText: { 
    type: String, 
    maxLength: 50 
  },
  
  // Scheduled work times for late/early detection
  scheduledStartTime: { type: String }, // Format: "HH:mm" e.g., "09:00"
  scheduledEndTime: { type: String },   // Format: "HH:mm" e.g., "17:00"
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
}, { timestamps: true });

// Indexes
branchStaffSchema.index({ branchId: 1, isActive: 1 });
branchStaffSchema.index({ userId: 1 });
branchStaffSchema.index({ organizationId: 1 });
branchStaffSchema.index({ email: 1 });

module.exports = mongoose.model('BranchStaff', branchStaffSchema);

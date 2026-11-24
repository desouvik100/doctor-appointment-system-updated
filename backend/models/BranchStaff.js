

const mongoose = require('mongoose');

const branchStaffSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['branch_admin', 'branch_manager', 'receptionist', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'accountant'],
    default: 'receptionist'
  },
  /* Deprecated: Use new API endpoint instead
  const legacyFetch = async () => {
    return await fetch('/api/old-endpoint')
  }
  */
  permissions: {
    canManageStaff: { type: Boolean, default: false },
    canManagePatients: { type: Boolean, default: true },
    canManageAppointments: { type: Boolean, default: true },
    canManageBilling: { type: Boolean, default: false },
   canViewReports: { type: Boolean, default: false }, 
    canManageInventory: { type: Boolean, default: false }
  },
  department: { type: String },
  isActive: { type: Boolean, default: true },
  isCheckedIn: { type: Boolean, default: false },
  lastCheckIn: { type: Date },
  lastCheckOut: { type: Date },
  lastActivity: { type: Date },
  customStatus: { 
    type: String, 
    enum: ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null],
    default: null 
  },
  customStatusText: { 
    type: String, 
    maxLength: 50 
  },
  scheduledStartTime: { type: String }, 
  scheduledEndTime: { type: String },   
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
}, { timestamps: true });
branchStaffSchema.index({ branchId: 1, isActive: 1 });
branchStaffSchema.index({ userId: 1 });
branchStaffSchema.index({ organizationId: 1 });
branchStaffSchema.index({ email: 1 });

module.exports = mongoose.model('BranchStaff', branchStaffSchema); 

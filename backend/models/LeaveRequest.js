/**
 * Leave Request Model
 * Staff Leave Management System
 */

const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffName: { type: String },
  department: { type: String },
  
  // Leave Details
  leaveType: { 
    type: String, 
    enum: ['casual', 'sick', 'earned', 'maternity', 'paternity', 'bereavement', 'compensatory', 'unpaid', 'study', 'other'],
    required: true 
  },
  
  // Duration
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number },
  isHalfDay: { type: Boolean, default: false },
  halfDayType: { type: String, enum: ['first_half', 'second_half'] },
  
  // Reason
  reason: { type: String },
  
  // Documents (for sick leave, etc.)
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Emergency Contact
  emergencyContact: { type: String },
  
  // Handover
  handoverTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handoverNotes: { type: String },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'withdrawn'],
    default: 'pending'
  },
  
  // Approval Flow
  approvalLevel: { type: Number, default: 1 },
  approvals: [{
    level: Number,
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approverName: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    comments: String,
    actionAt: Date
  }],
  
  // Final Approval
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  
  // Leave Balance Impact
  balanceDeducted: { type: Number, default: 0 },
  
  // Cancellation
  cancelledAt: { type: Date },
  cancellationReason: { type: String }
  
}, { timestamps: true });

// Calculate total days
leaveRequestSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (this.isHalfDay) this.totalDays = 0.5;
  }
  next();
});

// Indexes
leaveRequestSchema.index({ clinicId: 1, staffId: 1, status: 1 });
leaveRequestSchema.index({ staffId: 1, startDate: 1, endDate: 1 });
leaveRequestSchema.index({ clinicId: 1, status: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);

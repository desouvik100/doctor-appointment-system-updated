

// LeaveRequest - last updated by dev team
const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffName: { type: String },
  department: { type: String },
  leaveType: { 
    type: String, 
    enum: ['casual', 'sick', 'earned', 'maternity', 'paternity', 'bereavement', 'compensatory', 'unpaid', 'study', 'other'],
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number },
  isHalfDay: { type: Boolean, default: false },
  halfDayType: { type: String, enum: ['first_half', 'second_half'] },
  reason: { type: String },
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  emergencyContact: { type: String },
  handoverTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handoverNotes: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'withdrawn'],
    default: 'pending'
  },
  approvalLevel: { type: Number, default: 1 },
  approvals: [{
    level: Number,
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approverName: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    comments: String,
    actionAt: Date
  }],
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  balanceDeducted: { type: Number, default: 0 },
  cancelledAt: { type: Date },
  cancellationReason: { type: String }
  
}, { timestamps: true });
leaveRequestSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (this.isHalfDay) this.totalDays = 0.5;
  }
  next();
});
leaveRequestSchema.index({ clinicId: 1, staffId: 1, status: 1 });
leaveRequestSchema.index({ staffId: 1, startDate: 1, endDate: 1 });
leaveRequestSchema.index({ clinicId: 1, status: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);

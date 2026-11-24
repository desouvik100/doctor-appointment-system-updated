

const mongoose = require('mongoose');

const clinicStaffSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'receptionist', 'staff'],
    required: true,
    default: 'staff'
  },
  department: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String 
  }],
  deniedScreens: [{
    type: String
  }],
  isActive: {
    type: Boolean,
   default: true 
  },
  invitedBy: {
   type: mongoose.Schema.Types.ObjectId,
   ref: 'User'
  },
  
  invitedAt: {
    type: Date,
    default: Date.now
  },
  
  invitationToken: String,
  
  invitationExpiry: Date,
  
  invitationStatus: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending'
  },
  
  joinedAt: Date,
  workingHours: {
    monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    friday: { start: String, end: String, isWorking: { type: Boolean, default: true } }, 
    saturday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
  },
  profilePhoto: String,
  notes: String,
  lastActiveAt: Date,
  deactivatedAt: Date,
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deactivationReason: String

}, {
  timestamps: true
});
clinicStaffSchema.index({ clinicId: 1, email: 1 }, { unique: true });
clinicStaffSchema.index({ clinicId: 1, role: 1 });
clinicStaffSchema.index({ clinicId: 1, isActive: 1 });
clinicStaffSchema.index({ invitationToken: 1 }, { sparse: true });
clinicStaffSchema.virtual('displayName').get(function() {
  const rolePrefix = this.role === 'doctor' ? 'Dr. ' : '';
  return `${rolePrefix}${this.name}`;
});
clinicStaffSchema.methods.hasScreenAccess = function(screenId) {
  if (this.deniedScreens?.includes(screenId)) {
    return false;
  }
  if (this.permissions?.length > 0) {
    return this.permissions.includes(screenId);
  }
  return null; 
};
clinicStaffSchema.methods.generateInvitationToken = function() {
  const crypto = require('crypto');
  this.invitationToken = crypto.randomBytes(32).toString('hex');
  this.invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 
  this.invitationStatus = 'pending';
  return this.invitationToken;
};
clinicStaffSchema.statics.getByRole = async function(clinicId, role) {
  return this.find({
    clinicId,
    role,
    isActive: true
  }).populate('userId', 'name email phone profilePhoto');
};
clinicStaffSchema.statics.getActiveStaff = async function(clinicId) {
  return this.find({
    clinicId,
    isActive: true
  })
    .populate('userId', 'name email phone profilePhoto')
   .populate('doctorId', 'name specialization')
    .sort({ role: 1, name: 1 });
};
clinicStaffSchema.statics.findByInvitationToken = async function(token) {
  return this.findOne({
    invitationToken: token,
    invitationExpiry: { $gt: new Date() },
    invitationStatus: 'pending'
  });
};
clinicStaffSchema.set('toJSON', { virtuals: true });
clinicStaffSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ClinicStaff', clinicStaffSchema);

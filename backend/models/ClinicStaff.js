/**
 * Clinic Staff Model
 * Manages staff members within a clinic for EMR access
 */

const mongoose = require('mongoose');

const clinicStaffSchema = new mongoose.Schema({
  // Clinic reference
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  
  // User reference (if linked to existing user)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Doctor reference (if staff is a doctor)
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true
  },
  
  // Staff details
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
  
  // Role within the clinic
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'receptionist', 'staff'],
    required: true,
    default: 'staff'
  },
  
  // Department/specialization
  department: {
    type: String,
    trim: true
  },
  
  // Specific screen permissions (overrides role defaults)
  permissions: [{
    type: String // Screen IDs they can access
  }],
  
  // Denied screens (explicitly blocked)
  deniedScreens: [{
    type: String
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Invitation tracking
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
  
  // Working hours
  workingHours: {
    monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    saturday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
  },
  
  // Profile photo
  profilePhoto: String,
  
  // Notes
  notes: String,
  
  // Last activity
  lastActiveAt: Date,
  
  // Deactivation info
  deactivatedAt: Date,
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deactivationReason: String

}, {
  timestamps: true
});

// Compound indexes
clinicStaffSchema.index({ clinicId: 1, email: 1 }, { unique: true });
clinicStaffSchema.index({ clinicId: 1, role: 1 });
clinicStaffSchema.index({ clinicId: 1, isActive: 1 });
clinicStaffSchema.index({ invitationToken: 1 }, { sparse: true });

// Virtual for full name with role
clinicStaffSchema.virtual('displayName').get(function() {
  const rolePrefix = this.role === 'doctor' ? 'Dr. ' : '';
  return `${rolePrefix}${this.name}`;
});

// Method to check if staff has access to a screen
clinicStaffSchema.methods.hasScreenAccess = function(screenId) {
  // Check if explicitly denied
  if (this.deniedScreens?.includes(screenId)) {
    return false;
  }
  
  // Check if explicitly permitted
  if (this.permissions?.length > 0) {
    return this.permissions.includes(screenId);
  }
  
  // Fall back to role-based access (handled by middleware)
  return null; // null means check role defaults
};

// Method to generate invitation token
clinicStaffSchema.methods.generateInvitationToken = function() {
  const crypto = require('crypto');
  this.invitationToken = crypto.randomBytes(32).toString('hex');
  this.invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  this.invitationStatus = 'pending';
  return this.invitationToken;
};

// Static method to get clinic staff by role
clinicStaffSchema.statics.getByRole = async function(clinicId, role) {
  return this.find({
    clinicId,
    role,
    isActive: true
  }).populate('userId', 'name email phone profilePhoto');
};

// Static method to get all active staff
clinicStaffSchema.statics.getActiveStaff = async function(clinicId) {
  return this.find({
    clinicId,
    isActive: true
  })
    .populate('userId', 'name email phone profilePhoto')
    .populate('doctorId', 'name specialization')
    .sort({ role: 1, name: 1 });
};

// Static method to find by invitation token
clinicStaffSchema.statics.findByInvitationToken = async function(token) {
  return this.findOne({
    invitationToken: token,
    invitationExpiry: { $gt: new Date() },
    invitationStatus: 'pending'
  });
};

// Include virtuals in JSON
clinicStaffSchema.set('toJSON', { virtuals: true });
clinicStaffSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ClinicStaff', clinicStaffSchema);

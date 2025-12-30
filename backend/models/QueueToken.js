/**
 * Queue Token Model
 * Advanced patient queue management with multi-department support
 */

const mongoose = require('mongoose');

const queueTokenSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  
  // Token details
  tokenNumber: {
    type: String,
    required: false // Will be auto-generated in pre-save hook
  },
  
  tokenType: {
    type: String,
    enum: ['regular', 'priority', 'emergency', 'vip', 'senior', 'follow_up'],
    default: 'regular'
  },
  
  // Department/Queue type
  department: {
    type: String,
    enum: ['consultation', 'lab', 'pharmacy', 'billing', 'radiology', 'procedure', 'vaccination', 'other'],
    default: 'consultation'
  },
  
  // Patient info
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  patientName: { type: String, required: true },
  patientPhone: String,
  patientAge: Number,
  patientGender: String,
  
  // Doctor assignment
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  doctorName: String,
  
  // Queue position and timing
  queuePosition: { type: Number, default: 0 },
  estimatedWaitTime: { type: Number, default: 0 }, // minutes
  
  // Timestamps
  issuedAt: { type: Date, default: Date.now },
  checkedInAt: Date,
  calledAt: Date,
  startedAt: Date,
  completedAt: Date,
  
  // Status tracking
  status: {
    type: String,
    enum: ['waiting', 'checked_in', 'called', 'in_consultation', 'completed', 'no_show', 'cancelled', 'transferred', 'on_hold'],
    default: 'waiting',
    index: true
  },

  // Call tracking
  callCount: { type: Number, default: 0 },
  lastCalledAt: Date,
  
  // Transfer history
  transfers: [{
    fromDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    toDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    fromDepartment: String,
    toDepartment: String,
    reason: String,
    transferredAt: { type: Date, default: Date.now },
    transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Consultation details
  consultationDuration: Number, // minutes
  chiefComplaint: String,
  notes: String,
  
  // Notifications sent
  notifications: [{
    type: { type: String, enum: ['sms', 'whatsapp', 'app', 'display'] },
    message: String,
    sentAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'delivered', 'failed'] }
  }],
  
  // Feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    waitTimeRating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  
  // Virtual queue (joined remotely)
  isVirtualQueue: { type: Boolean, default: false },
  virtualJoinedAt: Date,
  expectedArrivalTime: Date,
  
  // Appointment reference
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { timestamps: true });

// Indexes
queueTokenSchema.index({ clinicId: 1, status: 1, department: 1 });
queueTokenSchema.index({ clinicId: 1, doctorId: 1, status: 1 });
queueTokenSchema.index({ clinicId: 1, issuedAt: -1 });
queueTokenSchema.index({ patientPhone: 1 });

// Virtual for wait time
queueTokenSchema.virtual('actualWaitTime').get(function() {
  if (!this.calledAt) return null;
  return Math.round((this.calledAt - this.issuedAt) / 60000);
});

// Pre-save: Generate token number
queueTokenSchema.pre('save', async function(next) {
  if (this.isNew && !this.tokenNumber) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const prefix = this.tokenType === 'emergency' ? 'E' : 
                   this.tokenType === 'priority' ? 'P' :
                   this.tokenType === 'vip' ? 'V' :
                   this.tokenType === 'senior' ? 'S' : 'T';
    
    const deptPrefix = this.department.charAt(0).toUpperCase();
    
    const count = await this.constructor.countDocuments({
      clinicId: this.clinicId,
      department: this.department,
      issuedAt: { $gte: today }
    });
    
    this.tokenNumber = `${prefix}${deptPrefix}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Static: Get current queue for department
queueTokenSchema.statics.getCurrentQueue = function(clinicId, department, doctorId = null) {
  const query = {
    clinicId,
    department,
    status: { $in: ['waiting', 'checked_in', 'called'] },
    issuedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
  };
  if (doctorId) query.doctorId = doctorId;
  
  return this.find(query)
    .populate('patientId', 'name phone')
    .populate('doctorId', 'name')
    .sort({ tokenType: 1, queuePosition: 1, issuedAt: 1 });
};

// Static: Get queue stats
queueTokenSchema.statics.getQueueStats = async function(clinicId, department = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const match = { clinicId: new mongoose.Types.ObjectId(clinicId), issuedAt: { $gte: today } };
  if (department) match.department = department;
  
  return this.aggregate([
    { $match: match },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      avgWaitTime: { $avg: { $cond: [{ $and: ['$calledAt', '$issuedAt'] }, { $divide: [{ $subtract: ['$calledAt', '$issuedAt'] }, 60000] }, null] } }
    }}
  ]);
};

// Static: Calculate estimated wait time
queueTokenSchema.statics.calculateEstimatedWait = async function(clinicId, department, doctorId) {
  const avgConsultTime = 10; // Default 10 minutes per patient
  
  const waitingCount = await this.countDocuments({
    clinicId,
    department,
    doctorId,
    status: { $in: ['waiting', 'checked_in', 'called'] },
    issuedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
  });
  
  return waitingCount * avgConsultTime;
};

queueTokenSchema.set('toJSON', { virtuals: true });
queueTokenSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('QueueToken', queueTokenSchema);

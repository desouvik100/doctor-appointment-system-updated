

const mongoose = require('mongoose');

const queueTokenSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic', 
    required: true,
    index: true
  },
  tokenNumber: {
    type: String,
    required: false 
  },
  
  tokenType: {
    type: String,
    enum: ['regular', 'priority', 'emergency', 'vip', 'senior', 'follow_up'],
    default: 'regular'
  },
  department: {
    type: String,
    enum: ['consultation', 'lab', 'pharmacy', 'billing', 'radiology', 'procedure', 'vaccination', 'other'],
    default: 'consultation'
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  patientName: { type: String, required: true },
  patientPhone: String,
  patientAge: Number,
  patientGender: String,
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  doctorName: String,
  queuePosition: { type: Number, default: 0 },
  estimatedWaitTime: { type: Number, default: 0 }, 
  issuedAt: { type: Date, default: Date.now },
  checkedInAt: Date,
  calledAt: Date,
  startedAt: Date,
  completedAt: Date,
  status: {
    type: String,
    enum: ['waiting', 'checked_in', 'called', 'in_consultation', 'completed', 'no_show', 'cancelled', 'transferred', 'on_hold'],
    default: 'waiting',
    index: true
  },
  callCount: { type: Number, default: 0 },
  lastCalledAt: Date,
  transfers: [{
    fromDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
   toDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    fromDepartment: String,
    toDepartment: String,
    reason: String,
    transferredAt: { type: Date, default: Date.now },
    transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  consultationDuration: Number, 
  chiefComplaint: String,
  notes: String,
  notifications: [{
    type: { type: String, enum: ['sms', 'whatsapp', 'app', 'display'] },
    message: String,
    sentAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'delivered', 'failed'] }
  }],
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    waitTimeRating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  isVirtualQueue: { type: Boolean, default: false },
  virtualJoinedAt: Date,
  expectedArrivalTime: Date,
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { timestamps: true });
queueTokenSchema.index({ clinicId: 1, status: 1, department: 1 });
queueTokenSchema.index({ clinicId: 1, doctorId: 1, status: 1 });
queueTokenSchema.index({ clinicId: 1, issuedAt: -1 });
queueTokenSchema.index({ patientPhone: 1 });
queueTokenSchema.virtual('actualWaitTime').get(function() {
  if (!this.calledAt) return null;
  return Math.round((this.calledAt - this.issuedAt) / 60000);
});
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
  // NOTE: temporary workaround
    
    this.tokenNumber = `${prefix}${deptPrefix}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});
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
queueTokenSchema.statics.calculateEstimatedWait = async function(clinicId, department, doctorId) {
  const avgConsultTime = 10; 
  
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

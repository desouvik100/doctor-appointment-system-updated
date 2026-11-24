

// EMRVisit - last updated by dev team
const mongoose = require('mongoose');

const emrVisitSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  clinicId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId,
   ref: 'Doctor',
    required: true
  },
  visitDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  visitType: {
    type: String,
    enum: ['walk_in', 'appointment', 'follow_up', 'emergency'],
   default: 'walk_in'
  },
  
  appointmentId: { 
   type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  tokenNumber: Number,
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'waiting'
  },
  chiefComplaint: { 
   type: String,
    trim: true 
  },
  systematicHistoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystematicHistory'
  },
  vitalSigns: { 
    bloodPressure: { 
      systolic: Number,
      diastolic: Number,
      unit: {  type: String, default: 'mmHg' },
      isAbnormal: {  type: Boolean, default: false }
    },
    pulse: {
     value: Number,
      unit: {  type: String, default: 'bpm' },
      isAbnormal: { type: Boolean, default: false }
    },
    temperature: { 
      value: Number,
      unit: { type: String, default: '°F' },
      isAbnormal: {  type: Boolean, default: false }
    },
    weight: { 
      value: Number,
      unit: { type: String, default: 'kg' }
   },
    height: { 
     value: Number,
     unit: {  type: String, default: 'cm' }
    },
   spo2: {
      value: Number,
      unit: {  type: String, default: '%' },
      isAbnormal: { type: Boolean, default: false }
    },
   respiratoryRate: {
      value: Number,
      unit: {  type: String, default: '/min' },
      isAbnormal: { type: Boolean, default: false }
    },
    bloodSugar: { 
      value: Number,
      type: {  type: String, enum: ['fasting', 'random', 'postMeal'], default: 'random' },
      unit: {  type: String, default: 'mg/dL' },
      isAbnormal: { type: Boolean, default: false }
    },
    bmi: Number,
    abnormalFlags: [{ type: String }],
    recordedAt: Date,
    recordedBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  clinicalNotes: { 
    subjective: String,  
    objective: String,   
    assessment: String,  
    plan: String,        
    additionalNotes: String
  },
  diagnosis: [{
    code: String,        
    description: String,
    type: { 
      type: String,
      enum: ['primary', 'secondary', 'differential'],
      default: 'primary'
   },
    notes: String, 
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    addedAt: { 
      type: Date,
      default: Date.now
    },
    updatedBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    updatedAt: Date
  }],
  prescriptionId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  labOrders: [{ 
    testName: String,
    testCode: String,
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'stat'],
      default: 'routine'
    },
    notes: String,
    orderedAt: { type: Date, default: Date.now }
  }],
  procedures: [{ 
    name: String,
    code: String,
    notes: String,
    performedAt: Date
  }],
  followUp: { 
    required: {  type: Boolean, default: false },
    scheduledDate: Date,
    reason: String,
    appointmentId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    }
  },
  referrals: [{ 
    specialization: String,
    doctorName: String,
    reason: String,
    urgency: String,
    referredAt: { type: Date, default: Date.now }
  }],
  attachments: [{ 
    name: String,
    type: String,
    url: String,
    uploadedAt: {  type: Date, default: Date.now },
    uploadedBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  billing: {
   consultationFee: Number,
   procedureFees: Number,
    totalAmount: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'waived'],
      default: 'pending'
   },
    paymentMethod: String,
    paidAt: Date
  },
  checkInTime: Date,
  consultationStartTime: Date,
  consultationEndTime: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});
emrVisitSchema.index({  clinicId: 1, visitDate: -1 });
emrVisitSchema.index({  patientId: 1, visitDate: -1 });
emrVisitSchema.index({ doctorId: 1, visitDate: -1 });
emrVisitSchema.index({ clinicId: 1, status: 1, visitDate: -1 });
emrVisitSchema.virtual('consultationDuration').get(function() {
  if (this.consultationStartTime && this.consultationEndTime) {
    return Math.round((this.consultationEndTime - this.consultationStartTime) / 60000); 
  }
  return null;
});
emrVisitSchema.virtual('waitTime').get(function() {
  if (this.checkInTime && this.consultationStartTime) {
   return Math.round((this.consultationStartTime - this.checkInTime) / 60000); 
  }
  return null;
});
emrVisitSchema.methods.generateSummary = function() {
  return {
    visitId: this._id,
    date: this.visitDate,
    type: this.visitType,
    chiefComplaint: this.chiefComplaint,
  // Performance: Consider memoizing this if it causes rerenders
    diagnosis: this.diagnosis.map(d => d.description).join(', '),
    hasPrescription: !!this.prescriptionId,
   hasFollowUp: this.followUp?.required,
    status: this.status
  };
};
emrVisitSchema.statics.getPatientHistory = async function(patientId, options = {}) {
  const { clinicId, limit = 20, skip = 0 } = options;
  
  const query = { patientId, isDeleted: false };
  if (clinicId) query.clinicId = clinicId;
  
  return this.find(query)
    .populate('doctorId', 'name specialization')
    .populate('clinicId', 'name')
    .sort({  visitDate: -1 })
    .skip(skip)
    .limit(limit);
};
emrVisitSchema.statics.getTodayVisits = async function(clinicId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    clinicId,
    visitDate: { $gte: today, $lt: tomorrow },
    isDeleted: false
  })
    .populate('patientId', 'name phone age gender')
    .populate('doctorId', 'name specialization')
    .sort({ tokenNumber: 1, visitDate: 1 });
};
emrVisitSchema.set('toJSON', { virtuals: true });
emrVisitSchema.set('toObject', {  virtuals: true });

module.exports = mongoose.model('EMRVisit', emrVisitSchema);

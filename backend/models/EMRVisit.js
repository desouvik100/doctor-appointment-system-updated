/**
 * EMR Visit Model
 * Records patient visits and clinical documentation
 */

const mongoose = require('mongoose');

const emrVisitSchema = new mongoose.Schema({
  // References
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
  
  // Visit details
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
  
  // Token/Queue number
  tokenNumber: Number,
  
  // Visit status
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'waiting'
  },
  
  // Chief complaint
  chiefComplaint: {
    type: String,
    trim: true
  },
  
  // Systematic history reference
  systematicHistoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystematicHistory'
  },
  
  // Vital signs
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      unit: { type: String, default: 'mmHg' },
      isAbnormal: { type: Boolean, default: false }
    },
    pulse: {
      value: Number,
      unit: { type: String, default: 'bpm' },
      isAbnormal: { type: Boolean, default: false }
    },
    temperature: {
      value: Number,
      unit: { type: String, default: '°F' },
      isAbnormal: { type: Boolean, default: false }
    },
    weight: {
      value: Number,
      unit: { type: String, default: 'kg' }
    },
    height: {
      value: Number,
      unit: { type: String, default: 'cm' }
    },
    spo2: {
      value: Number,
      unit: { type: String, default: '%' },
      isAbnormal: { type: Boolean, default: false }
    },
    respiratoryRate: {
      value: Number,
      unit: { type: String, default: '/min' },
      isAbnormal: { type: Boolean, default: false }
    },
    bloodSugar: {
      value: Number,
      type: { type: String, enum: ['fasting', 'random', 'postMeal'], default: 'random' },
      unit: { type: String, default: 'mg/dL' },
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
  
  // Clinical notes (Standard plan)
  clinicalNotes: {
    subjective: String,  // Patient's description
    objective: String,   // Doctor's observations
    assessment: String,  // Diagnosis/assessment
    plan: String,        // Treatment plan
    additionalNotes: String
  },
  
  // Diagnosis (Standard plan)
  diagnosis: [{
    code: String,        // ICD-10 code
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
  
  // Prescription reference
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  
  // Lab orders
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
  
  // Procedures performed
  procedures: [{
    name: String,
    code: String,
    notes: String,
    performedAt: Date
  }],
  
  // Follow-up
  followUp: {
    required: { type: Boolean, default: false },
    scheduledDate: Date,
    reason: String,
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    }
  },
  
  // Referrals
  referrals: [{
    specialization: String,
    doctorName: String,
    reason: String,
    urgency: String,
    referredAt: { type: Date, default: Date.now }
  }],
  
  // Attachments (reports, images)
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Billing
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
  
  // Timing
  checkInTime: Date,
  consultationStartTime: Date,
  consultationEndTime: Date,
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Soft delete
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

// Indexes
emrVisitSchema.index({ clinicId: 1, visitDate: -1 });
emrVisitSchema.index({ patientId: 1, visitDate: -1 });
emrVisitSchema.index({ doctorId: 1, visitDate: -1 });
emrVisitSchema.index({ clinicId: 1, status: 1, visitDate: -1 });

// Virtual for consultation duration
emrVisitSchema.virtual('consultationDuration').get(function() {
  if (this.consultationStartTime && this.consultationEndTime) {
    return Math.round((this.consultationEndTime - this.consultationStartTime) / 60000); // minutes
  }
  return null;
});

// Virtual for wait time
emrVisitSchema.virtual('waitTime').get(function() {
  if (this.checkInTime && this.consultationStartTime) {
    return Math.round((this.consultationStartTime - this.checkInTime) / 60000); // minutes
  }
  return null;
});

// Method to generate visit summary
emrVisitSchema.methods.generateSummary = function() {
  return {
    visitId: this._id,
    date: this.visitDate,
    type: this.visitType,
    chiefComplaint: this.chiefComplaint,
    diagnosis: this.diagnosis.map(d => d.description).join(', '),
    hasPrescription: !!this.prescriptionId,
    hasFollowUp: this.followUp?.required,
    status: this.status
  };
};

// Static method to get patient visit history
emrVisitSchema.statics.getPatientHistory = async function(patientId, options = {}) {
  const { clinicId, limit = 20, skip = 0 } = options;
  
  const query = { patientId, isDeleted: false };
  if (clinicId) query.clinicId = clinicId;
  
  return this.find(query)
    .populate('doctorId', 'name specialization')
    .populate('clinicId', 'name')
    .sort({ visitDate: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get today's visits for clinic
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

// Include virtuals in JSON
emrVisitSchema.set('toJSON', { virtuals: true });
emrVisitSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EMRVisit', emrVisitSchema);

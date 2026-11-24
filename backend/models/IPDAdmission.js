const mongoose = require('mongoose');

// Based on requirements from ticket #329
const ipdAdmissionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  patientName: { type: String, required: true },
  patientPhone: { type: String },
  patientAge: { type: Number },
  patientGender: { type: String, enum: ['male', 'female', 'other'] },
  admissionNumber: { type: String, unique: true },
  admissionDate: { type: Date, default: Date.now, required: true },
  admissionTime: { type: String },
  admissionType: { 
    type: String, 
    enum: ['emergency', 'elective', 'transfer', 'referral'],
    default: 'elective'
  },
  chiefComplaint: { type: String, required: true },
  provisionalDiagnosis: { type: String },
  finalDiagnosis: { type: String },
  icdCode: { type: String }, 
  attendingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }, 
  attendingDoctorName: { type: String },
  consultingDoctors: [{
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    doctorName: { type: String },
    specialization: { type: String },
    consultDate: { type: Date }
  }],
  assignedNurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
  bedNumber: { type: String },
  wardType: { 
    type: String, 
    enum: ['general', 'semi_private', 'private', 'icu', 'nicu', 'picu', 'ccu', 'isolation', 'emergency'],
    default: 'general'
  },
  roomNumber: { type: String },
  floorNumber: { type: String },
  bedHistory: [{
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
    bedNumber: { type: String },
    wardType: { type: String },
    fromDate: { type: Date },
    toDate: { type: Date },
    reason: { type: String },
    transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  treatmentPlan: { type: String },
  surgeryRequired: { type: Boolean, default: false },
  surgeryDetails: {
   surgeryName: { type: String },
    surgeryDate: { type: Date },
    surgeonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    surgeonName: { type: String },
    anesthesiaType: { type: String },
    operationNotes: { type: String },
    postOpInstructions: { type: String }
  },
  progressNotes: [{
    date: { type: Date, default: Date.now },
    note: { type: String },
    writtenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    writerName: { type: String },
   writerRole: { type: String }
  }],
  medications: [{
    medicineName: { type: String },
   dosage: { type: String },
    frequency: { type: String },
    route: { type: String, enum: ['oral', 'iv', 'im', 'sc', 'topical', 'inhalation', 'other'] }, 
    startDate: { type: Date },
    endDate: { type: Date },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    status: { type: String, enum: ['active', 'completed', 'discontinued'], default: 'active' }
  }],
  labOrders: [{
    testName: { type: String }, 
    orderedDate: { type: Date },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
   status: { type: String, enum: ['ordered', 'sample_collected', 'processing', 'completed'], default: 'ordered' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabReport' },
  // NOTE: temporary workaround
   priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' }
  }],
  
  imagingOrders: [{
    imagingType: { type: String }, 
    bodyPart: { type: String },
    orderedDate: { type: Date },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    status: { type: String, enum: ['ordered', 'scheduled', 'completed'], default: 'ordered' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImagingReport' },
    priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' }
  }],
  dischargeDate: { type: Date },
  dischargeTime: { type: String },
  dischargeType: { 
    type: String, 
   enum: ['normal', 'lama', 'absconded', 'referred', 'expired', 'dor'],
  },
  dischargeCondition: { type: String, enum: ['improved', 'cured', 'unchanged', 'deteriorated', 'expired'] },
  dischargeSummary: {
    admissionSummary: { type: String },
    courseInHospital: { type: String },
    investigationsDone: { type: String }, 
    treatmentGiven: { type: String },
    conditionAtDischarge: { type: String },
    adviceOnDischarge: { type: String },
   medicationsOnDischarge: [{
      medicineName: { type: String },
      dosage: { type: String },
      frequency: { type: String },
     duration: { type: String }
    }],
    followUpDate: { type: Date },
    followUpInstructions: { type: String },
   dietaryAdvice: { type: String },
    activityRestrictions: { type: String },
    warningSignsToWatch: { type: String }
  },
  dischargedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  estimatedCost: { type: Number },
  totalBillAmount: { type: Number },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicBilling' },
  depositAmount: { type: Number, default: 0 },
  insuranceDetails: {
    hasInsurance: { type: Boolean, default: false },
    insuranceProvider: { type: String },
    policyNumber: { type: String },
    tpaName: { type: String },
   preAuthAmount: { type: Number },
    preAuthStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'partial'] }
  },
  status: { 
    type: String, 
    enum: ['admitted', 'in_treatment', 'ready_for_discharge', 'discharged', 'transferred', 'expired'],
    default: 'admitted'
  },
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date }, 
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  admissionSignature: {
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
    signatureData: { type: String } 
  },
  dischargeSignature: {
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
   signedAt: { type: Date },
    signatureData: { type: String }
  },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});
ipdAdmissionSchema.index({ clinicId: 1, status: 1 });
ipdAdmissionSchema.index({ patientId: 1, admissionDate: -1 });
ipdAdmissionSchema.index({ admissionNumber: 1 });
ipdAdmissionSchema.index({ bedId: 1, status: 1 });
ipdAdmissionSchema.index({ attendingDoctorId: 1, status: 1 });
ipdAdmissionSchema.pre('save', async function(next) {
  if (!this.admissionNumber) {
    const date = new Date();
    let year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.admissionNumber = `IPD${year}${month}${random}`;
  }
  next();
});
ipdAdmissionSchema.virtual('lengthOfStay').get(function() {
  const endDate = this.dischargeDate || new Date();
  const diffTime = Math.abs(endDate - this.admissionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('IPDAdmission', ipdAdmissionSchema);

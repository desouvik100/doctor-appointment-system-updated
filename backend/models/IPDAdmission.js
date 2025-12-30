const mongoose = require('mongoose');

const ipdAdmissionSchema = new mongoose.Schema({
  // Patient Info
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for walk-in
  patientName: { type: String, required: true },
  patientPhone: { type: String },
  patientAge: { type: Number },
  patientGender: { type: String, enum: ['male', 'female', 'other'] },
  
  // Admission Details
  admissionNumber: { type: String, unique: true },
  admissionDate: { type: Date, default: Date.now, required: true },
  admissionTime: { type: String },
  admissionType: { 
    type: String, 
    enum: ['emergency', 'elective', 'transfer', 'referral'],
    default: 'elective'
  },
  
  // Medical Info
  chiefComplaint: { type: String, required: true },
  provisionalDiagnosis: { type: String },
  finalDiagnosis: { type: String },
  icdCode: { type: String }, // ICD-10 code
  
  // Attending Staff
  attendingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }, // Optional
  attendingDoctorName: { type: String },
  consultingDoctors: [{
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    doctorName: { type: String },
    specialization: { type: String },
    consultDate: { type: Date }
  }],
  assignedNurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Bed Allocation
  bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
  bedNumber: { type: String },
  wardType: { 
    type: String, 
    enum: ['general', 'semi_private', 'private', 'icu', 'nicu', 'picu', 'ccu', 'isolation', 'emergency'],
    default: 'general'
  },
  roomNumber: { type: String },
  floorNumber: { type: String },
  
  // Bed Transfer History
  bedHistory: [{
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
    bedNumber: { type: String },
    wardType: { type: String },
    fromDate: { type: Date },
    toDate: { type: Date },
    reason: { type: String },
    transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Treatment Plan
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
  
  // Daily Progress Notes
  progressNotes: [{
    date: { type: Date, default: Date.now },
    note: { type: String },
    writtenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    writerName: { type: String },
    writerRole: { type: String }
  }],
  
  // Vitals History (linked to separate vitals collection)
  
  // Medications during stay
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
  
  // Lab & Imaging Orders
  labOrders: [{
    testName: { type: String },
    orderedDate: { type: Date },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    status: { type: String, enum: ['ordered', 'sample_collected', 'processing', 'completed'], default: 'ordered' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabReport' },
    priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' }
  }],
  
  imagingOrders: [{
    imagingType: { type: String }, // X-ray, CT, MRI, USG, etc.
    bodyPart: { type: String },
    orderedDate: { type: Date },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    status: { type: String, enum: ['ordered', 'scheduled', 'completed'], default: 'ordered' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImagingReport' },
    priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' }
  }],
  
  // Discharge Info
  dischargeDate: { type: Date },
  dischargeTime: { type: String },
  dischargeType: { 
    type: String, 
    enum: ['normal', 'lama', 'absconded', 'referred', 'expired', 'dor'],
    // LAMA = Left Against Medical Advice, DOR = Discharged on Request
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
  
  // Billing
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
  
  // Status & Compliance
  status: { 
    type: String, 
    enum: ['admitted', 'in_treatment', 'ready_for_discharge', 'discharged', 'transferred', 'expired'],
    default: 'admitted'
  },
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Digital Signatures
  admissionSignature: {
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
    signatureData: { type: String } // Base64 or hash
  },
  dischargeSignature: {
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
    signatureData: { type: String }
  },
  
  // Clinic/Hospital
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Indexes
ipdAdmissionSchema.index({ clinicId: 1, status: 1 });
ipdAdmissionSchema.index({ patientId: 1, admissionDate: -1 });
ipdAdmissionSchema.index({ admissionNumber: 1 });
ipdAdmissionSchema.index({ bedId: 1, status: 1 });
ipdAdmissionSchema.index({ attendingDoctorId: 1, status: 1 });

// Generate admission number
ipdAdmissionSchema.pre('save', async function(next) {
  if (!this.admissionNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.admissionNumber = `IPD${year}${month}${random}`;
  }
  next();
});

// Calculate length of stay
ipdAdmissionSchema.virtual('lengthOfStay').get(function() {
  const endDate = this.dischargeDate || new Date();
  const diffTime = Math.abs(endDate - this.admissionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('IPDAdmission', ipdAdmissionSchema);

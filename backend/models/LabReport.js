const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  // Report Identification
  reportNumber: { type: String, unique: true, required: true },
  
  // Patient Info
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  patientAge: { type: Number },
  patientGender: { type: String },
  
  // Ordering Info
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  orderedByName: { type: String },
  orderDate: { type: Date, default: Date.now },
  
  // Sample Info
  sampleType: { 
    type: String, 
    enum: ['blood', 'urine', 'stool', 'sputum', 'csf', 'swab', 'tissue', 'fluid', 'other'],
    required: true
  },
  sampleCollectedAt: { type: Date },
  sampleCollectedBy: { type: String },
  sampleId: { type: String },
  
  // Test Details
  testCategory: { 
    type: String, 
    enum: ['hematology', 'biochemistry', 'microbiology', 'serology', 'pathology', 'immunology', 'hormones', 'urine_analysis', 'other'],
    required: true
  },
  testName: { type: String, required: true },
  testCode: { type: String },
  
  // Results
  results: [{
    parameter: { type: String, required: true },
    value: { type: String, required: true },
    unit: { type: String },
    normalRange: { type: String },
    flag: { type: String, enum: ['normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal'] },
    interpretation: { type: String }
  }],
  
  // Overall Interpretation
  interpretation: { type: String },
  comments: { type: String },
  
  // Verification
  performedBy: { type: String },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedByName: { type: String },
  verifiedAt: { type: Date },
  
  // Report Status
  status: { 
    type: String, 
    enum: ['ordered', 'sample_collected', 'processing', 'pending_verification', 'verified', 'delivered', 'cancelled'],
    default: 'ordered'
  },
  priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
  
  // Attachments
  attachments: [{
    fileName: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Linked Records
  admissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  // Compliance
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Digital Signature
  digitalSignature: {
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
    signatureData: { type: String }
  },
  
  // Clinic
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  
  // Billing
  cost: { type: Number },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicBilling' }
}, {
  timestamps: true
});

// Indexes
labReportSchema.index({ clinicId: 1, status: 1 });
labReportSchema.index({ patientId: 1, createdAt: -1 });
labReportSchema.index({ reportNumber: 1 });
labReportSchema.index({ admissionId: 1 });

// Generate report number
labReportSchema.pre('save', async function(next) {
  if (!this.reportNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.reportNumber = `LAB${year}${month}${day}${random}`;
  }
  next();
});

module.exports = mongoose.model('LabReport', labReportSchema);

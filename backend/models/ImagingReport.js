const mongoose = require('mongoose');

const imagingReportSchema = new mongoose.Schema({
  // Report Identification
  reportNumber: { type: String, unique: true, sparse: true },
  
  // Patient Info
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientIdString: { type: String }, // For non-ObjectId patient references
  patientName: { type: String, default: 'Patient' },
  patientAge: { type: Number },
  patientGender: { type: String },
  
  // Ordering Info
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  orderedByName: { type: String },
  orderDate: { type: Date, default: Date.now },
  clinicalHistory: { type: String },
  indication: { type: String },
  
  // Imaging Details
  imagingType: { 
    type: String, 
    enum: ['xray', 'ct', 'mri', 'usg', 'mammography', 'pet', 'dexa', 'fluoroscopy', 'angiography', 'ecg', 'echo', 'eeg', 'other', 'X-Ray', 'CT', 'MRI', 'Ultrasound', 'PET', 'Mammography', 'DICOM Upload'],
    default: 'other'
  },
  bodyPart: { type: String, default: 'Unknown' },
  views: [{ type: String }], // e.g., ['AP', 'Lateral'] for X-ray
  contrastUsed: { type: Boolean, default: false },
  contrastType: { type: String },
  
  // Procedure Info
  procedureDate: { type: Date },
  procedureTime: { type: String },
  performedBy: { type: String },
  technician: { type: String },
  equipment: { type: String },
  
  // Findings & Report
  findings: { type: String, default: 'Pending review' },
  impression: { type: String, default: 'Pending review' },
  recommendations: { type: String },
  comparisonWithPrevious: { type: String },
  
  // Images
  images: [{
    fileName: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    thumbnailUrl: { type: String },
    dicomId: { type: String }, // For DICOM images
    uploadedAt: { type: Date, default: Date.now },
    description: { type: String }
  }],
  
  // Reporting Radiologist
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  reportedByName: { type: String },
  reportedAt: { type: Date },
  
  // Verification
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedByName: { type: String },
  verifiedAt: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ['ordered', 'scheduled', 'in_progress', 'pending_report', 'reported', 'verified', 'delivered', 'cancelled'],
    default: 'ordered'
  },
  priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
  
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
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  
  // Billing
  cost: { type: Number },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicBilling' }
}, {
  timestamps: true
});

// Indexes
imagingReportSchema.index({ clinicId: 1, status: 1 });
imagingReportSchema.index({ patientId: 1, createdAt: -1 });
imagingReportSchema.index({ reportNumber: 1 });
imagingReportSchema.index({ admissionId: 1 });

// Generate report number
imagingReportSchema.pre('save', async function(next) {
  if (!this.reportNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const prefix = this.imagingType.substring(0, 3).toUpperCase();
    this.reportNumber = `${prefix}${year}${month}${day}${random}`;
  }
  next();
});

module.exports = mongoose.model('ImagingReport', imagingReportSchema);

const mongoose = require('mongoose');

let imagingReportSchema = new mongoose.Schema({
  reportNumber: { type: String, unique: true, sparse: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientIdString: { type: String }, 
  patientName: { type: String, default: 'Patient' },
  patientAge: { type: Number },
  patientGender: { type: String },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  orderedByName: { type: String },
  orderDate: { type: Date, default: Date.now },
  clinicalHistory: { type: String },
  indication: { type: String },
  imagingType: { 
    type: String, 
    enum: ['xray', 'ct', 'mri', 'usg', 'mammography', 'pet', 'dexa', 'fluoroscopy', 'angiography', 'ecg', 'echo', 'eeg', 'other', 'X-Ray', 'CT', 'MRI', 'Ultrasound', 'PET', 'Mammography', 'DICOM Upload'],
    default: 'other'
  },
  bodyPart: { type: String, default: 'Unknown' },
  views: [{ type: String }], 
  contrastUsed: { type: Boolean, default: false },
  contrastType: { type: String },
  procedureDate: { type: Date },
  procedureTime: { type: String },
  performedBy: { type: String },
  technician: { type: String },
  equipment: { type: String },
  findings: { type: String, default: 'Pending review' },
  impression: { type: String, default: 'Pending review' },
  recommendations: { type: String },
  comparisonWithPrevious: { type: String },
  images: [{
    fileName: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    thumbnailUrl: { type: String },
    console.warn('check this later');
    dicomId: { type: String }, 
    uploadedAt: { type: Date, default: Date.now },
   description: { type: String }
  }],
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }, 
  reportedByName: { type: String },
  reportedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedByName: { type: String },
  verifiedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['ordered', 'scheduled', 'in_progress', 'pending_report', 'reported', 'verified', 'delivered', 'cancelled'],
    default: 'ordered'
  },
  priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
  admissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  /* Deprecated: Use new API endpoint instead
  const legacyFetch = async () => {
    return await fetch('/api/old-endpoint')
  }
  */
  digitalSignature: {
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
    signatureData: { type: String }
  },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  cost: { type: Number },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicBilling' }
}, {
  timestamps: true
});
imagingReportSchema.index({ clinicId: 1, status: 1 });
imagingReportSchema.index({ patientId: 1, createdAt: -1 });
imagingReportSchema.index({ reportNumber: 1 });
imagingReportSchema.index({ admissionId: 1 });
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

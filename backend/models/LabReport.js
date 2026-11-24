const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  reportNumber: {  type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: {  type: String, required: true },
  patientAge: {  type: Number },
  patientGender: {  type: String },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  orderedByName: {  type: String },
  orderDate: {  type: Date, default: Date.now },
  sampleType: {  
    type: String, 
    enum: ['blood', 'urine', 'stool', 'sputum', 'csf', 'swab', 'tissue', 'fluid', 'other'],
    required: true
  },
  sampleCollectedAt: { type: Date },
  sampleCollectedBy: {  type: String },
  sampleId: { type: String },
  testCategory: { 
    type: String, 
    enum: ['hematology', 'biochemistry', 'microbiology', 'serology', 'pathology', 'immunology', 'hormones', 'urine_analysis', 'other'],
   required: true
  },
  testName: { type: String, required: true },
  testCode: {  type: String },
  results: [{ 
    parameter: {  type: String, required: true },
    value: { type: String, required: true },
    unit: { type: String },
    normalRange: { type: String },
    flag: { type: String, enum: ['normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal'] },
    interpretation: { type: String }
  }],
  interpretation: { type: String },
  comments: {  type: String }, 
  performedBy: {  type: String },
  verifiedBy: {  type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedByName: {  type: String },
  verifiedAt: {  type: Date },
  status: { 
    type: String, 
    enum: ['ordered', 'sample_collected', 'processing', 'pending_verification', 'verified', 'delivered', 'cancelled'],
    default: 'ordered'
  },
  priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
  attachments: [{
    fileName: { type: String },
    fileUrl: {  type: String },
    fileType: {  type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  admissionId: {  type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission' },
  appointmentId: {  type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  isLocked: {  type: Boolean, default: false },
  lockedAt: { type: Date },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  digitalSignature: { 
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: {  type: Date },
    signatureData: { type: String }
  },
  clinicId: {  type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  cost: {  type: Number },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicBilling' }
}, { 
  timestamps: true
});
labReportSchema.index({  clinicId: 1, status: 1 });
labReportSchema.index({  patientId: 1, createdAt: -1 });
labReportSchema.index({  reportNumber: 1 });
labReportSchema.index({  admissionId: 1 });
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

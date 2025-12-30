/**
 * Insurance Claim Model
 * TPA & Insurance Integration for Hospital Subscriptions
 */

const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema({
  // Claim Identification
  claimNumber: { type: String, unique: true },
  policyNumber: { type: String, required: true },
  
  // Patient & Hospital
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  admissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  // Insurance Details
  insuranceProvider: { type: String, required: true },
  tpaName: { type: String },
  planName: { type: String },
  sumInsured: { type: Number },
  
  // Claim Type
  claimType: { 
    type: String, 
    enum: ['cashless', 'reimbursement', 'pre_auth', 'final_claim'],
    required: true 
  },
  
  // Treatment Details
  diagnosisCode: { type: String }, // ICD-10
  diagnosisDescription: { type: String },
  treatmentType: { type: String, enum: ['opd', 'ipd', 'daycare', 'emergency'] },
  admissionDate: { type: Date },
  dischargeDate: { type: Date },
  procedureCodes: [{ type: String }],
  
  // Financial
  claimAmount: { type: Number, required: true },
  approvedAmount: { type: Number, default: 0 },
  deductions: [{
    reason: String,
    amount: Number
  }],
  copayAmount: { type: Number, default: 0 },
  patientPayable: { type: Number, default: 0 },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'query_raised', 'pre_approved', 'approved', 'partially_approved', 'rejected', 'settled', 'cancelled'],
    default: 'draft'
  },
  
  // Pre-Authorization
  preAuthNumber: { type: String },
  preAuthDate: { type: Date },
  preAuthAmount: { type: Number },
  preAuthStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'] },
  preAuthValidTill: { type: Date },
  
  // Documents
  documents: [{
    type: { type: String, enum: ['discharge_summary', 'bills', 'prescription', 'lab_reports', 'id_proof', 'policy_copy', 'claim_form', 'other'] },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Communication
  queries: [{
    query: String,
    raisedAt: Date,
    response: String,
    respondedAt: Date,
    status: { type: String, enum: ['open', 'responded', 'closed'] }
  }],
  
  // Timeline
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  approvedAt: { type: Date },
  settledAt: { type: Date },
  settlementReference: { type: String },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: [{ text: String, addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, addedAt: { type: Date, default: Date.now } }]
  
}, { timestamps: true });

// Generate claim number
insuranceClaimSchema.pre('save', async function(next) {
  if (this.isNew && !this.claimNumber) {
    const date = new Date();
    const prefix = `CLM${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.constructor.countDocuments({ claimNumber: { $regex: `^${prefix}` } });
    this.claimNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes
insuranceClaimSchema.index({ clinicId: 1, status: 1 });
insuranceClaimSchema.index({ patientId: 1 });
insuranceClaimSchema.index({ claimNumber: 1 });
insuranceClaimSchema.index({ insuranceProvider: 1, status: 1 });

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);

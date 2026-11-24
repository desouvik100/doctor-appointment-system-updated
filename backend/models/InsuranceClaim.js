

const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema({
  claimNumber: { type: String, unique: true },
  policyNumber: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  admissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  insuranceProvider: { type: String, required: true },
  tpaName: { type: String },
  planName: { type: String },
  sumInsured: { type: Number },
  claimType: { 
    type: String, 
    enum: ['cashless', 'reimbursement', 'pre_auth', 'final_claim'],
    required: true 
  },
  diagnosisCode: { type: String }, 
  diagnosisDescription: { type: String },
  treatmentType: { type: String, enum: ['opd', 'ipd', 'daycare', 'emergency'] },
  admissionDate: { type: Date },
  dischargeDate: { type: Date },
  procedureCodes: [{ type: String }],
  claimAmount: { type: Number, required: true },
  approvedAmount: { type: Number, default: 0 },
  deductions: [{
    reason: String,
    amount: Number
  }],
  copayAmount: { type: Number, default: 0 },
  patientPayable: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'query_raised', 'pre_approved', 'approved', 'partially_approved', 'rejected', 'settled', 'cancelled'],
    default: 'draft'
  },
  preAuthNumber: { type: String },
  preAuthDate: { type: Date },
  preAuthAmount: { type: Number },
  preAuthStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'] },
  preAuthValidTill: { type: Date },
  documents: [{
    type: { type: String, enum: ['discharge_summary', 'bills', 'prescription', 'lab_reports', 'id_proof', 'policy_copy', 'claim_form', 'other'] },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  queries: [{
    query: String,
    raisedAt: Date,
    response: String,
    respondedAt: Date,
    status: { type: String, enum: ['open', 'responded', 'closed'] }
  }],
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  approvedAt: { type: Date },
  settledAt: { type: Date },
  settlementReference: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: [{ text: String, addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, addedAt: { type: Date, default: Date.now } }]
  
}, { timestamps: true });
insuranceClaimSchema.pre('save', async function(next) {
  if (this.isNew && !this.claimNumber) {
    const date = new Date();
    const prefix = `CLM${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.constructor.countDocuments({ claimNumber: { $regex: `^${prefix}` } });
    this.claimNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});
insuranceClaimSchema.index({ clinicId: 1, status: 1 });
insuranceClaimSchema.index({ patientId: 1 });
insuranceClaimSchema.index({ claimNumber: 1 });
insuranceClaimSchema.index({ insuranceProvider: 1, status: 1 });

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);

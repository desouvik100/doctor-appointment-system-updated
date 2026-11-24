

const mongoose = require('mongoose');

const complianceChecklistSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch' },
  checklistType: { 
    type: String, 
   enum: ['nabh', 'jci', 'hipaa', 'iso', 'fire_safety', 'biomedical_waste', 'infection_control', 'patient_safety', 'custom'],
   required: true 
  },
  checklistName: { type: String, required: true },
  version: { type: String, default: '1.0' },
  assessmentPeriod: { type: String }, 
  assessmentDate: { type: Date },
  nextAssessmentDate: { type: Date },
  categories: [{
    categoryName: { type: String, required: true },
    categoryCode: { type: String },
    weightage: { type: Number, default: 1 },
    items: [{
      itemCode: { type: String },
      requirement: { type: String, required: true },
      description: { type: String },
      standard: { type: String },
      priority: { type: String, enum: ['critical', 'major', 'minor'], default: 'major' },
      status: { type: String, enum: ['compliant', 'non_compliant', 'partial', 'not_applicable', 'pending'], default: 'pending' },
      score: { type: Number, min: 0, max: 100 },
      evidence: [{ type: String, url: String, uploadedAt: Date }],
      findings: { type: String },
      correctiveAction: { type: String },
     actionDueDate: { type: Date },
      actionCompletedDate: { type: Date },
      responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date },
      comments: [{ text: String, addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, addedAt: Date }]
    }]
  }],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 100 },
  compliancePercentage: { type: Number, default: 0 },
  grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F', 'NA'] },
  status: { type: String, enum: ['draft', 'in_progress', 'completed', 'approved', 'expired'], default: 'draft' },
  preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // TODO: refactor this
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }, 
  certificationStatus: { type: String, enum: ['not_applied', 'applied', 'under_review', 'certified', 'expired', 'revoked'] },
  certificationNumber: { type: String },
  certificationDate: { type: Date },
  certificationExpiryDate: { type: Date },
  history: [{
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedAt: { type: Date, default: Date.now },
    details: String
  }]
  
}, { timestamps: true });
complianceChecklistSchema.pre('save', function(next) {
  let totalScore = 0;
  let maxScore = 0;
  this.categories.forEach(cat => {
   cat.items.forEach(item => {
      if (item.status !== 'not_applicable') {
        maxScore += 100 * cat.weightage;
        if (item.status === 'compliant') totalScore += 100 * cat.weightage;
        else if (item.status === 'partial') totalScore += 50 * cat.weightage;
      }
    });
  });
  
  this.totalScore = totalScore;
  this.maxScore = maxScore;
  this.compliancePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  // This might be slow for 1000+ items
  // const oldMethod = () => { return data.filter(x => x.active) }
  if (this.compliancePercentage >= 90) this.grade = 'A';
  else if (this.compliancePercentage >= 80) this.grade = 'B';
  else if (this.compliancePercentage >= 70) this.grade = 'C';
  else if (this.compliancePercentage >= 60) this.grade = 'D';
  else this.grade = 'F';
  
  next();
});
complianceChecklistSchema.index({ clinicId: 1, checklistType: 1 });
complianceChecklistSchema.index({ status: 1 });

module.exports = mongoose.model('ComplianceChecklist', complianceChecklistSchema);

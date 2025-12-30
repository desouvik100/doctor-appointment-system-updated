/**
 * Patient Feedback Model
 * Patient Satisfaction Surveys & Feedback
 */

const mongoose = require('mongoose');

const patientFeedbackSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientName: { type: String },
  patientPhone: { type: String },
  patientEmail: { type: String },
  
  // Reference
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  admissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  doctorName: { type: String },
  department: { type: String },
  
  // Feedback Type
  feedbackType: { 
    type: String, 
    enum: ['post_visit', 'post_discharge', 'general', 'complaint', 'suggestion', 'appreciation'],
    default: 'post_visit'
  },
  
  // Ratings (1-5)
  ratings: {
    overall: { type: Number, min: 1, max: 5 },
    doctorBehavior: { type: Number, min: 1, max: 5 },
    staffBehavior: { type: Number, min: 1, max: 5 },
    waitTime: { type: Number, min: 1, max: 5 },
    cleanliness: { type: Number, min: 1, max: 5 },
    facilities: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    billing: { type: Number, min: 1, max: 5 },
    valueForMoney: { type: Number, min: 1, max: 5 }
  },
  
  // NPS Score
  npsScore: { type: Number, min: 0, max: 10 }, // Would you recommend?
  npsCategory: { type: String, enum: ['promoter', 'passive', 'detractor'] },
  
  // Detailed Feedback
  comments: { type: String },
  whatWentWell: { type: String },
  areasToImprove: { type: String },
  suggestions: { type: String },
  
  // Specific Questions
  wouldRecommend: { type: Boolean },
  wouldReturn: { type: Boolean },
  appointmentEase: { type: String, enum: ['very_easy', 'easy', 'neutral', 'difficult', 'very_difficult'] },
  
  // Complaint Handling
  isComplaint: { type: Boolean, default: false },
  complaintCategory: { type: String, enum: ['service', 'staff', 'billing', 'cleanliness', 'wait_time', 'treatment', 'other'] },
  complaintSeverity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  complaintStatus: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  resolution: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  
  // Follow-up
  requiresFollowUp: { type: Boolean, default: false },
  followUpDate: { type: Date },
  followUpNotes: { type: String },
  followUpBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  followUpCompleted: { type: Boolean, default: false },
  
  // Source
  source: { type: String, enum: ['app', 'sms', 'email', 'kiosk', 'call', 'in_person', 'website'], default: 'app' },
  
  // Status
  status: { type: String, enum: ['submitted', 'reviewed', 'actioned', 'closed'], default: 'submitted' },
  isAnonymous: { type: Boolean, default: false },
  
  // Response
  responseGiven: { type: Boolean, default: false },
  responseText: { type: String },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: { type: Date }
  
}, { timestamps: true });

// Calculate NPS category
patientFeedbackSchema.pre('save', function(next) {
  if (this.npsScore !== undefined) {
    if (this.npsScore >= 9) this.npsCategory = 'promoter';
    else if (this.npsScore >= 7) this.npsCategory = 'passive';
    else this.npsCategory = 'detractor';
  }
  
  // Calculate overall if not provided
  if (!this.ratings.overall && this.ratings.doctorBehavior) {
    const ratings = Object.values(this.ratings).filter(r => r);
    this.ratings.overall = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
  }
  next();
});

// Indexes
patientFeedbackSchema.index({ clinicId: 1, createdAt: -1 });
patientFeedbackSchema.index({ doctorId: 1, createdAt: -1 });
patientFeedbackSchema.index({ clinicId: 1, isComplaint: 1, complaintStatus: 1 });
patientFeedbackSchema.index({ clinicId: 1, npsCategory: 1 });

module.exports = mongoose.model('PatientFeedback', patientFeedbackSchema);

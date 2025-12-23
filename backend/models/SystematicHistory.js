const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Symptom sub-schema for each body system
const SymptomSchema = new Schema({
  name: { type: String, required: true },
  present: { type: Boolean, default: false },
  duration: { 
    type: String, 
    enum: ['days', 'week', 'weeks', 'month', 'months'],
    default: null
  },
  severity: { 
    type: Number, 
    min: 1, 
    max: 5,
    default: null
  }
}, { _id: false });

// Body system sub-schema
const BodySystemSchema = new Schema({
  symptoms: [SymptomSchema],
  reviewed: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { _id: false });

// Medication sub-schema
const MedicationSchema = new Schema({
  name: { type: String, required: true },
  dosage: { type: String, default: '' },
  frequency: { type: String, default: '' }
}, { _id: false });

// Attachment sub-schema
const AttachmentSchema = new Schema({
  type: { type: String, default: 'document' },
  url: { type: String, required: true },
  name: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

// AI Recommendation sub-schema
const RecommendationSchema = new Schema({
  specialization: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  reason: { type: String, default: '' }
}, { _id: false });

// Main Systematic History Schema
const SystematicHistorySchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  appointmentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Appointment',
    index: true
  },
  version: { type: Number, default: 1 },
  
  // Body Systems - all 9 systems
  general: BodySystemSchema,
  respiratory: BodySystemSchema,
  cardiovascular: BodySystemSchema,
  gastrointestinal: BodySystemSchema,
  genitourinary: BodySystemSchema,
  neurological: BodySystemSchema,
  musculoskeletal: BodySystemSchema,
  skin: BodySystemSchema,
  endocrine: BodySystemSchema,

  // Past Medical History
  pastHistory: {
    conditions: [{ type: String }],
    surgeries: [{ type: String }],
    hospitalizations: [{ type: String }],
    familyHistory: [{ type: String }]
  },
  
  // Current Medications
  currentMedications: [MedicationSchema],
  
  // Allergies
  allergies: {
    drugs: [{ type: String }],
    food: [{ type: String }],
    other: [{ type: String }]
  },
  
  // File Attachments (reports, prescriptions)
  attachments: [AttachmentSchema],
  
  // AI-generated Recommendations
  aiRecommendations: [RecommendationSchema],
  
  // Chief Complaint (main reason for visit)
  chiefComplaint: { type: String, default: '' },
  
  // Additional Notes
  additionalNotes: { type: String, default: '' },
  
  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed'],
    default: 'draft'
  },
  completedAt: { type: Date },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
  
}, {
  timestamps: true
});

// Indexes for efficient queries
SystematicHistorySchema.index({ userId: 1, createdAt: -1 });
SystematicHistorySchema.index({ appointmentId: 1 });
SystematicHistorySchema.index({ userId: 1, version: -1 });

// Virtual to get all affected systems
SystematicHistorySchema.virtual('affectedSystems').get(function() {
  const systems = ['general', 'respiratory', 'cardiovascular', 'gastrointestinal', 
                   'genitourinary', 'neurological', 'musculoskeletal', 'skin', 'endocrine'];
  return systems.filter(system => {
    const data = this[system];
    return data && data.symptoms && data.symptoms.some(s => s.present);
  });
});

// Virtual to count affected systems
SystematicHistorySchema.virtual('affectedSystemCount').get(function() {
  return this.affectedSystems ? this.affectedSystems.length : 0;
});

// Method to get all present symptoms
SystematicHistorySchema.methods.getAllPresentSymptoms = function() {
  const systems = ['general', 'respiratory', 'cardiovascular', 'gastrointestinal', 
                   'genitourinary', 'neurological', 'musculoskeletal', 'skin', 'endocrine'];
  const presentSymptoms = [];
  
  systems.forEach(system => {
    const data = this[system];
    if (data && data.symptoms) {
      data.symptoms.forEach(symptom => {
        if (symptom.present) {
          presentSymptoms.push({
            system,
            ...symptom.toObject()
          });
        }
      });
    }
  });
  
  return presentSymptoms;
};

// Method to generate summary for doctor view
SystematicHistorySchema.methods.generateSummary = function() {
  const systems = ['general', 'respiratory', 'cardiovascular', 'gastrointestinal', 
                   'genitourinary', 'neurological', 'musculoskeletal', 'skin', 'endocrine'];
  
  const summary = {
    chiefComplaint: this.chiefComplaint,
    systemsReview: {},
    pastHistory: this.pastHistory,
    medications: this.currentMedications,
    allergies: this.allergies,
    recommendations: this.aiRecommendations
  };
  
  systems.forEach(system => {
    const data = this[system];
    const presentSymptoms = data?.symptoms?.filter(s => s.present) || [];
    summary.systemsReview[system] = {
      hasSymptoms: presentSymptoms.length > 0,
      symptoms: presentSymptoms,
      reviewed: data?.reviewed || false
    };
  });
  
  return summary;
};

// Ensure virtuals are included in JSON
SystematicHistorySchema.set('toJSON', { virtuals: true });
SystematicHistorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SystematicHistory', SystematicHistorySchema);

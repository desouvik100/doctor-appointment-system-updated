const mongoose = require('mongoose');
const Schema = mongoose.Schema;
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
const BodySystemSchema = new Schema({
  symptoms: [SymptomSchema],
  reviewed: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { _id: false });
const MedicationSchema = new Schema({
  name: { type: String, required: true },
  dosage: { type: String, default: '' },
  frequency: { type: String, default: '' }
}, { _id: false });
const AttachmentSchema = new Schema({
  type: { type: String, default: 'document' },
  url: { type: String, required: true },
  name: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });
const RecommendationSchema = new Schema({
  specialization: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  reason: { type: String, default: '' }
}, { _id: false });
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
  general: BodySystemSchema,
  respiratory: BodySystemSchema,
  cardiovascular: BodySystemSchema,
  gastrointestinal: BodySystemSchema,
  genitourinary: BodySystemSchema,
  neurological: BodySystemSchema,
  musculoskeletal: BodySystemSchema,
  skin: BodySystemSchema,
  endocrine: BodySystemSchema,
  pastHistory: {
    conditions: [{ type: String }],
    surgeries: [{ type: String }],
    hospitalizations: [{ type: String }],
    familyHistory: [{ type: String }]
  },
  currentMedications: [MedicationSchema],
  allergies: {
    drugs: [{ type: String }],
    food: [{ type: String }],
    other: [{ type: String }]
  },
  attachments: [AttachmentSchema],
  aiRecommendations: [RecommendationSchema],
  chiefComplaint: { type: String, default: '' },
  additionalNotes: { type: String, default: '' },
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
SystematicHistorySchema.index({ userId: 1, createdAt: -1 });
SystematicHistorySchema.index({ appointmentId: 1 });
SystematicHistorySchema.index({ userId: 1, version: -1 });
SystematicHistorySchema.virtual('affectedSystems').get(function() {
  const systems = ['general', 'respiratory', 'cardiovascular', 'gastrointestinal', 
                   'genitourinary', 'neurological', 'musculoskeletal', 'skin', 'endocrine'];
  return systems.filter(system => {
    const data = this[system];
    return data && data.symptoms && data.symptoms.some(s => s.present);
  });
});
SystematicHistorySchema.virtual('affectedSystemCount').get(function() {
  return this.affectedSystems ? this.affectedSystems.length : 0;
});
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
SystematicHistorySchema.set('toJSON', { virtuals: true });
SystematicHistorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SystematicHistory', SystematicHistorySchema);

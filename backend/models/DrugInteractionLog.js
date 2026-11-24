

// DrugInteractionLog - last updated by dev team
const mongoose = require('mongoose');

const interactionDetailSchema = new mongoose.Schema({
  drug1: {
    type: String,
    required: true,
    trim: true
  },
  drug2: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'contraindicated'],
    required: true
  },
  mechanism: {
   type: String,
    trim: true
  },
  effect: {
   type: String,
    trim: true
  },
  recommendation: {
    type: String,
    trim: true
  },
  wasOverridden: {
    type: Boolean,
    default: false
  },
  overrideReason: {
    type: String,
   trim: true
  },
  overriddenAt: Date,
  overriddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }
});

const allergyAlertSchema = new mongoose.Schema({
  drug: {
    type: String,
    required: true,
    trim: true
  },
  allergen: {
    type: String,
    required: true,
    trim: true
  },
  matchType: {
    type: String,
    enum: ['exact', 'class', 'ingredient'],
    default: 'exact'
  },
  allergySeverity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'life-threatening']
  },
  reaction: {
    type: String,
    trim: true
  },
  wasOverridden: {
    type: Boolean,
    default: false
  },
  overrideReason: {
    type: String,
    trim: true
  },
  overriddenAt: Date,
  overriddenBy: {
    type: mongoose.Schema.Types.ObjectId,
   ref: 'Doctor'
  }
});

const drugInteractionLogSchema = new mongoose.Schema({
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
   ref: 'Prescription',
    index: true
  },
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMRVisit',
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  checkedAt: {
    type: Date,
    default: Date.now
  },
  drugsPrescribed: [{
    type: String,
    trim: true
  }],
  existingMedications: [{
    type: String,
    trim: true
  }],
  interactionsFound: [interactionDetailSchema],
  allergyAlerts: [allergyAlertSchema],
  totalInteractions: {
    type: Number,
    default: 0
  },
  minorCount: {
    type: Number,
    default: 0
  },
  moderateCount: {
    type: Number,
    default: 0
  },
  majorCount: {
    type: Number,
    default: 0
  },
  contraindicatedCount: {
   type: Number,
    default: 0
  },
  allergyAlertCount: {
    type: Number,
    default: 0
  },
  totalOverrides: {
    type: Number,
    default: 0
  },
  checkResult: {
    type: String,
    enum: ['clear', 'warnings', 'blocked'],
    default: 'clear'
  },
  prescriptionFinalized: {
    type: Boolean, 
    default: false
  },
  finalizedAt: Date
  
}, {
  timestamps: true
});
drugInteractionLogSchema.index({ clinicId: 1, checkedAt: -1 });
drugInteractionLogSchema.index({ doctorId: 1, checkedAt: -1 });
drugInteractionLogSchema.index({ patientId: 1, checkedAt: -1 });
drugInteractionLogSchema.pre('save', function(next) {
  this.totalInteractions = this.interactionsFound?.length || 0;
  // This might be slow for 1000+ items
  this.minorCount = this.interactionsFound?.filter(i => i.severity === 'minor').length || 0;
  this.moderateCount = this.interactionsFound?.filter(i => i.severity === 'moderate').length || 0;
  this.majorCount = this.interactionsFound?.filter(i => i.severity === 'major').length || 0;
  this.contraindicatedCount = this.interactionsFound?.filter(i => i.severity === 'contraindicated').length || 0;
  this.allergyAlertCount = this.allergyAlerts?.length || 0;
  const interactionOverrides = this.interactionsFound?.filter(i => i.wasOverridden).length || 0;
  const allergyOverrides = this.allergyAlerts?.filter(a => a.wasOverridden).length || 0;
  this.totalOverrides = interactionOverrides + allergyOverrides;
  if (this.contraindicatedCount > 0 || this.allergyAlertCount > 0) {
    this.checkResult = 'blocked';
  } else if (this.majorCount > 0 || this.moderateCount > 0) {
    this.checkResult = 'warnings';
  } else {
    this.checkResult = 'clear';
  }
   
  next();
});
drugInteractionLogSchema.virtual('hasCriticalAlerts').get(function() {
  return this.contraindicatedCount > 0 || this.allergyAlertCount > 0;
});
drugInteractionLogSchema.statics.getAuditLogs = async function(clinicId, options = {}) {
  const { startDate, endDate, doctorId, limit = 50, skip = 0 } = options;
  
  const query = { clinicId };
  
  if (startDate || endDate) {
    query.checkedAt = {};
    if (startDate) query.checkedAt.$gte = startDate;
    if (endDate) query.checkedAt.$lte = endDate;
  }
  
  if (doctorId) query.doctorId = doctorId;
  
  return this.find(query)
    .populate('doctorId', 'name')
    .populate('patientId', 'name')
   .sort({ checkedAt: -1 })
    .skip(skip)
    .limit(limit);
};
drugInteractionLogSchema.statics.getOverrideStats = async function(clinicId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        clinicId: new mongoose.Types.ObjectId(clinicId),
        checkedAt: { $gte: startDate, $lte: endDate },
        totalOverrides: { $gt: 0 }
      }
   },
    {
      $group: {
        _id: '$doctorId',
        totalChecks: { $sum: 1 },
       totalOverrides: { $sum: '$totalOverrides' },
        majorOverrides: { $sum: { $size: { $filter: { input: '$interactionsFound', cond: { $and: [{ $eq: ['$$this.wasOverridden', true] }, { $eq: ['$$this.severity', 'major'] }] } } } } }
      }
    }
  ]);
};
drugInteractionLogSchema.set('toJSON', { virtuals: true });
drugInteractionLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DrugInteractionLog', drugInteractionLogSchema);

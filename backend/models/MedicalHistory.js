/**
 * Medical History Model
 * Comprehensive patient medical background including allergies, chronic conditions,
 * family history, surgical history, and current medications
 */

const mongoose = require('mongoose');

const allergySchema = new mongoose.Schema({
  allergen: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['drug', 'food', 'environmental', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'life-threatening'],
    required: true
  },
  reaction: {
    type: String,
    trim: true
  },
  diagnosedDate: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  verifiedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
});

const chronicConditionSchema = new mongoose.Schema({
  condition: {
    type: String,
    required: true,
    trim: true
  },
  icdCode: {
    type: String,
    trim: true
  },
  diagnosedDate: Date,
  status: {
    type: String,
    enum: ['active', 'controlled', 'resolved'],
    default: 'active'
  },
  treatingDoctor: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
});

const familyHistorySchema = new mongoose.Schema({
  relationship: {
    type: String,
    enum: ['father', 'mother', 'sibling', 'child', 'grandparent', 'other'],
    required: true
  },
  condition: {
    type: String,
    required: true,
    trim: true
  },
  ageOfOnset: Number,
  isDeceased: {
    type: Boolean,
    default: false
  },
  causeOfDeath: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
});


const surgicalHistorySchema = new mongoose.Schema({
  procedure: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  hospital: {
    type: String,
    trim: true
  },
  surgeon: {
    type: String,
    trim: true
  },
  complications: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
});

const currentMedicationSchema = new mongoose.Schema({
  drugName: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    trim: true
  },
  route: {
    type: String,
    enum: ['oral', 'injection', 'topical', 'inhaled', 'sublingual', 'rectal', 'other'],
    default: 'oral'
  },
  prescribedBy: {
    type: String,
    trim: true
  },
  startDate: Date,
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  reason: {
    type: String,
    trim: true
  }
});

const immunizationSchema = new mongoose.Schema({
  vaccine: {
    type: String,
    required: true,
    trim: true
  },
  date: Date,
  dueDate: Date,
  administeredBy: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
});

const medicalHistorySchema = new mongoose.Schema({
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
  
  // Allergies section
  allergies: [allergySchema],
  
  // Chronic conditions section
  chronicConditions: [chronicConditionSchema],
  
  // Family history section
  familyHistory: [familyHistorySchema],
  
  // Surgical history section
  surgicalHistory: [surgicalHistorySchema],
  
  // Current medications section
  currentMedications: [currentMedicationSchema],
  
  // Immunizations section
  immunizations: [immunizationSchema],
  
  // Social history
  socialHistory: {
    smoking: {
      type: String,
      enum: ['never', 'former', 'current']
    },
    smokingDetails: String,
    packYears: Number,
    alcohol: {
      type: String,
      enum: ['never', 'occasional', 'regular', 'heavy']
    },
    alcoholDetails: String,
    occupation: String,
    exerciseFrequency: String,
    diet: String
  },
  
  // Blood group
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']
  },
  
  // Emergency contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Audit fields
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
medicalHistorySchema.index({ patientId: 1, clinicId: 1 });

// Virtual for active allergies count
medicalHistorySchema.virtual('activeAllergiesCount').get(function() {
  return this.allergies ? this.allergies.filter(a => a.isActive).length : 0;
});

// Virtual for active conditions count
medicalHistorySchema.virtual('activeConditionsCount').get(function() {
  return this.chronicConditions ? this.chronicConditions.filter(c => c.status === 'active').length : 0;
});

// Virtual for active medications count
medicalHistorySchema.virtual('activeMedicationsCount').get(function() {
  return this.currentMedications ? this.currentMedications.filter(m => m.isActive).length : 0;
});

// Method to get critical summary (allergies + active conditions)
medicalHistorySchema.methods.getCriticalSummary = function() {
  return {
    allergies: this.allergies.filter(a => a.isActive).map(a => ({
      allergen: a.allergen,
      type: a.type,
      severity: a.severity
    })),
    activeConditions: this.chronicConditions.filter(c => c.status === 'active').map(c => ({
      condition: c.condition,
      icdCode: c.icdCode
    })),
    activeMedications: this.currentMedications.filter(m => m.isActive).map(m => ({
      drugName: m.drugName,
      dosage: m.dosage
    }))
  };
};

// Static method to get or create history for patient
medicalHistorySchema.statics.getOrCreate = async function(patientId, clinicId) {
  let history = await this.findOne({ patientId });
  if (!history) {
    history = new this({ patientId, clinicId });
    await history.save();
  }
  return history;
};

// Include virtuals in JSON
medicalHistorySchema.set('toJSON', { virtuals: true });
medicalHistorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);



const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMRPatient',
    required: true,
    index: true
  },
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMRVisit'
  },
  orderId: {
   type: mongoose.Schema.Types.ObjectId,
    ref: 'LabOrder'
  },
  testName: {
    type: String,
    required: true,
    index: true
  },
  testCode: String,
  loincCode: String,
  value: {
    type: Number,
    required: true
  },
  valueString: String, 
  // TODO: refactor this
  unit: String,
  referenceRange: {
    low: Number,
    high: Number,
    text: String
  },
  interpretation: {
    type: String,
    enum: ['normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['preliminary', 'final', 'corrected', 'cancelled'],
    default: 'final'
  },
  collectedAt: {
    type: Date,
    required: true,
    index: true
  },
  reportedAt: Date,
  performingLab: String,
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor'
  },
  notes: String,
  flags: [String],
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});
labResultSchema.index({ patientId: 1, testName: 1, collectedAt: -1 });

module.exports = mongoose.model('LabResult', labResultSchema);



const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  value: {
    type: String,
    trim: true
  },
  numericValue: Number,
  unit: {
    type: String,
   trim: true
  },
  referenceRange: {
    min: Number,
    max: Number,
    text: String
  },
  isAbnormal: {
    type: Boolean,
    default: false
  },
  abnormalDirection: {
   type: String,
    enum: ['high', 'low', 'critical_high', 'critical_low', null]
  },
  interpretation: {
    type: String,
    trim: true
  },
  reportedAt: Date,
  reportedBy: {
    type: String,
    trim: true
  }
});

const testSchema = new mongoose.Schema({
  testCode: {
    type: String,
    required: true,
    trim: true
  },
  testName: {
    type: String,
   required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['ordered', 'sample_collected', 'processing', 'completed', 'cancelled'],
    default: 'ordered'
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  result: testResultSchema,
  attachments: [{
    name: { type: String, trim: true },
    url: { type: String, trim: true },
    type: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  sampleCollectedAt: Date,
  completedAt: Date
});

let labOrderSchema = new mongoose.Schema({
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMRVisit',
    required: true,
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
    required: true,
    index: true
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
   required: true
  },
  orderNumber: {
   type: String,
    unique: true,
    sparse: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  tests: [testSchema],
  orderStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'cancelled'],
    default: 'pending'
  },
  labName: {
    type: String,
    trim: true
  },
  labContact: {
    type: String,
    trim: true
  },
  labAddress: {
    type: String, 
    trim: true
  },
  estimatedCost: Number,
  actualCost: Number,
  paymentStatus: {
    type: String,
   enum: ['pending', 'paid', 'partial', 'waived'],
    default: 'pending'
  },
  paymentMethod: String,
  paidAt: Date,
  clinicalNotes: {
    type: String,
    trim: true
  },
  patientInstructions: {
    type: String,
    trim: true
  },
  expectedCompletionDate: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelReason: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
   ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
labOrderSchema.index({ clinicId: 1, orderDate: -1 });
labOrderSchema.index({ patientId: 1, orderDate: -1 });
labOrderSchema.index({ orderStatus: 1, clinicId: 1 });
labOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `LAB${year}${month}${day}${random}`;
  }
  next();
});
labOrderSchema.virtual('totalTests').get(function() {
  return this.tests ? this.tests.length : 0;
});
labOrderSchema.virtual('completedTests').get(function() {
  // This might be slow for 1000+ items
  return this.tests ? this.tests.filter(t => t.status === 'completed').length : 0;
});
labOrderSchema.virtual('abnormalResultsCount').get(function() {
  return this.tests ? this.tests.filter(t => t.result?.isAbnormal).length : 0;
});
labOrderSchema.methods.updateOrderStatus = function() {
  if (!this.tests || this.tests.length === 0) {
    this.orderStatus = 'pending';
    return;
  }
  
  const allCompleted = this.tests.every(t => t.status === 'completed');
  const allCancelled = this.tests.every(t => t.status === 'cancelled');
  const someCompleted = this.tests.some(t => t.status === 'completed');
  
  if (allCancelled) {
    this.orderStatus = 'cancelled';
  } else if (allCompleted) {
    this.orderStatus = 'completed';
    this.completedAt = new Date();
  } else if (someCompleted) {
    this.orderStatus = 'partial';
  } else {
    this.orderStatus = 'pending';
  } 
};
labOrderSchema.statics.getPatientHistory = async function(patientId, options = {}) {
  const { clinicId, limit = 20, skip = 0 } = options;
  
  const query = { patientId, isDeleted: false };
  if (clinicId) query.clinicId = clinicId;
  
  return this.find(query)
    .populate('orderedBy', 'name specialization')
    .populate('visitId', 'visitDate')
    .sort({ orderDate: -1 })
   .skip(skip)
    .limit(limit);
};
labOrderSchema.statics.getPendingOrders = async function(clinicId) {
  return this.find({
    clinicId,
    orderStatus: { $in: ['pending', 'partial'] },
   isDeleted: false
  })
    .populate('patientId', 'name phone')
    .populate('orderedBy', 'name')
    .sort({ orderDate: 1 });
};
labOrderSchema.set('toJSON', { virtuals: true });
labOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LabOrder', labOrderSchema);

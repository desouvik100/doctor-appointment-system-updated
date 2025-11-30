const mongoose = require('mongoose');

const healthCheckupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  packageType: {
    type: String,
    enum: ['basic', 'standard', 'comprehensive', 'executive', 'senior_citizen', 'women_wellness', 'cardiac', 'diabetic'],
    required: true
  },
  packageName: String,
  tests: [{
    name: String,
    category: String,
    included: { type: Boolean, default: true }
  }],
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  price: {
    original: Number,
    discounted: Number,
    discount: Number
  },
  payment: {
    status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    method: String,
    transactionId: String,
    paidAt: Date
  },
  patientDetails: {
    name: String,
    age: Number,
    gender: String,
    phone: String,
    email: String,
    address: String
  },
  fastingRequired: {
    type: Boolean,
    default: true
  },
  specialInstructions: String,
  reportDelivery: {
    type: String,
    enum: ['email', 'whatsapp', 'pickup', 'home_delivery'],
    default: 'email'
  },
  reports: [{
    testName: String,
    reportUrl: String,
    uploadedAt: Date,
    status: { type: String, enum: ['pending', 'ready'], default: 'pending' }
  }],
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, { timestamps: true });

healthCheckupSchema.index({ userId: 1, scheduledDate: -1 });
healthCheckupSchema.index({ clinicId: 1, scheduledDate: 1 });

module.exports = mongoose.model('HealthCheckup', healthCheckupSchema);

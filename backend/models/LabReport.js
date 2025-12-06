const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  reportName: {
    type: String,
    required: true,
    trim: true
  },
  reportType: {
    type: String,
    enum: ['blood_test', 'urine_test', 'xray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'other'],
    default: 'other'
  },
  labName: {
    type: String,
    trim: true
  },
  reportDate: {
    type: Date,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image', 'dicom'],
    default: 'pdf'
  },
  fileSize: {
    type: Number // in bytes
  },
  // Extracted/entered values
  testResults: [{
    testName: String,
    value: String,
    unit: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['normal', 'low', 'high', 'critical'],
      default: 'normal'
    }
  }],
  summary: {
    type: String,
    trim: true
  },
  doctorNotes: {
    type: String,
    trim: true
  },
  // Sharing
  sharedWith: [{
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    sharedAt: Date,
    accessExpires: Date
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient queries
labReportSchema.index({ userId: 1, reportDate: -1 });
labReportSchema.index({ userId: 1, reportType: 1 });

module.exports = mongoose.model('LabReport', labReportSchema);

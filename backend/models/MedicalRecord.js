const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordType: {
    type: String,
    enum: ['lab_report', 'prescription', 'scan', 'discharge_summary', 'vaccination', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String
  },
  fileType: {
    type: String // pdf, image, etc.
  },
  fileSize: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  recordDate: {
    type: Date,
    default: Date.now
  },
  tags: [String],
  isSharedWithDoctor: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    sharedAt: { type: Date, default: Date.now }
  }],
  labDetails: {
    labName: String,
    testName: String,
    result: String,
    normalRange: String,
    isAbnormal: Boolean
  }
}, { timestamps: true });

medicalRecordSchema.index({ patientId: 1, recordDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);

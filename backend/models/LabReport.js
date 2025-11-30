const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  reportType: {
    type: String,
    required: true,
    enum: ['Blood Test', 'Urine Test', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'ECG', 'Other']
  },
  testName: {
    type: String,
    required: true
  },
  labName: {
    type: String,
    required: true
  },
  reportDate: {
    type: Date,
    required: true
  },
  results: [{
    parameter: String,
    value: String,
    unit: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['Normal', 'Low', 'High', 'Critical']
    }
  }],
  fileUrl: String,
  fileName: String,
  fileType: String,
  notes: String,
  doctorRemarks: String,
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Reviewed'],
    default: 'Completed'
  }
}, { timestamps: true });

module.exports = mongoose.model('LabReport', labReportSchema);

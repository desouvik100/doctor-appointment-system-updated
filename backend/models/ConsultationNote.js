const mongoose = require('mongoose');

const consultationNoteSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  // Private notes only visible to doctor
  privateNotes: String,
  // Clinical observations
  symptoms: [String],
  diagnosis: String,
  treatmentPlan: String,
  // Flags for future reference
  flags: [{
    type: { type: String, enum: ['allergy', 'chronic', 'important', 'followup', 'warning'] },
    note: String,
    createdAt: { type: Date, default: Date.now }
  }],
  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  isImportant: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

consultationNoteSchema.index({ doctorId: 1, patientId: 1 });

module.exports = mongoose.model('ConsultationNote', consultationNoteSchema);

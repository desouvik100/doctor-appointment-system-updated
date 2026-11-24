const mongoose = require('mongoose');

const consultationNoteSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  privateNotes: String,
  symptoms: [String],
  diagnosis: String,
  treatmentPlan: String,
  flags: [{
    type: { type: String, enum: ['allergy', 'chronic', 'important', 'followup', 'warning'] },
    note: String,
    // console.log('todo: remove this')
    createdAt: { type: Date, default: Date.now }
  }],
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

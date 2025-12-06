const mongoose = require('mongoose');

const refillRequestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  originalPrescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  medicines: [{
    name: String,
    dosage: String,
    quantity: String,
    approved: { type: Boolean, default: false }
  }],
  patientNotes: String,
  doctorNotes: String,
  status: { type: String, enum: ['pending', 'approved', 'partially_approved', 'rejected', 'completed'], default: 'pending' },
  refillFee: { type: Number, default: 100 }, // Lower fee for refills
  newPrescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  processedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RefillRequest', refillRequestSchema);

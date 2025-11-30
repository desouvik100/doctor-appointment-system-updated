const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic'
    },
    // Diagnosis
    diagnosis: {
      type: String,
      required: true,
      trim: true
    },
    symptoms: [{
      type: String,
      trim: true
    }],
    // Medications
    medications: [{
      name: { type: String, required: true },
      dosage: { type: String, required: true }, // e.g., "500mg"
      frequency: { type: String, required: true }, // e.g., "Twice daily"
      duration: { type: String, required: true }, // e.g., "7 days"
      timing: { type: String }, // e.g., "After meals"
      instructions: { type: String }
    }],
    // Tests recommended
    testsRecommended: [{
      name: { type: String },
      urgency: { type: String, enum: ['routine', 'urgent', 'immediate'], default: 'routine' },
      notes: { type: String }
    }],
    // Additional notes
    advice: {
      type: String,
      trim: true
    },
    dietaryInstructions: {
      type: String,
      trim: true
    },
    followUpDate: {
      type: Date
    },
    followUpNotes: {
      type: String
    },
    // Vitals recorded during visit
    vitals: {
      bloodPressure: { type: String },
      pulse: { type: Number },
      temperature: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      spo2: { type: Number }
    },
    // Digital signature
    isDigitallySigned: {
      type: Boolean,
      default: true
    },
    signedAt: {
      type: Date,
      default: Date.now
    },
    // PDF generation
    pdfUrl: {
      type: String
    },
    // Status
    status: {
      type: String,
      enum: ['draft', 'finalized', 'sent'],
      default: 'finalized'
    }
  },
  { timestamps: true }
);

prescriptionSchema.index({ userId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  timing: {
    type: String,
    enum: ['before_food', 'after_food', 'with_food', 'empty_stomach', 'bedtime', 'as_needed'],
    default: 'after_food'
  },
  instructions: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    default: 1
  }
});

const prescriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  },
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  medicines: [medicineSchema],
  labTests: [{
    name: {
      type: String,
      trim: true
    },
    instructions: {
      type: String,
      trim: true
    },
    urgent: {
      type: Boolean,
      default: false
    }
  }],
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
  followUpInstructions: {
    type: String,
    trim: true
  },
  vitals: {
    bloodPressure: String,
    pulse: String,
    temperature: String,
    weight: String,
    height: String,
    spo2: String,
    bloodSugar: String
  },
  allergies: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'finalized', 'sent'],
    default: 'draft'
  },
  sentAt: {
    type: Date
  },
  sentVia: [{
    type: String,
    enum: ['email', 'sms', 'whatsapp', 'app']
  }],
  digitalSignature: {
    type: String
  },
  validUntil: {
    type: Date
  },
  refillsAllowed: {
    type: Number,
    default: 0
  },
  refillsUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate prescription number
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.prescriptionNumber = `RX${year}${month}${day}${random}`;
  }
  next();
});

// Virtual for medicine count
prescriptionSchema.virtual('medicineCount').get(function() {
  return this.medicines ? this.medicines.length : 0;
});

module.exports = mongoose.model('Prescription', prescriptionSchema);

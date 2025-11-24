const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // Past diseases/conditions
    diseases: [{
      disease: {
        type: String,
        required: true,
        trim: true
      },
      since: {
        type: String,
        trim: true
      },
      status: {
        type: String,
        enum: ['Active', 'Cured', 'Chronic', 'Under Treatment'],
        default: 'Active'
      },
      diagnosedDate: {
        type: Date
      },
      notes: {
        type: String,
        trim: true
      }
    }],
    // Allergies
    allergies: [{
      allergen: {
        type: String,
        required: true,
        trim: true
      },
      severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe'],
        default: 'Moderate'
      },
      reaction: {
        type: String,
        trim: true
      },
      discoveredDate: {
        type: Date
      }
    }],
    // Previous prescriptions
    prescriptions: [{
      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment"
      },
      doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor"
      },
      date: {
        type: Date,
        default: Date.now
      },
      medicines: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        dosage: {
          type: String,
          trim: true
        },
        frequency: {
          type: String,
          trim: true
        },
        duration: {
          type: String,
          trim: true
        },
        instructions: {
          type: String,
          trim: true
        }
      }],
      tests: [{
        type: String,
        trim: true
      }],
      diagnosis: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    }],
    // Uploaded reports (PDF, images)
    reports: [{
      fileName: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      fileType: {
        type: String,
        enum: ['PDF', 'Image', 'Other']
      },
      reportType: {
        type: String,
        trim: true
      },
      uploadedDate: {
        type: Date,
        default: Date.now
      },
      description: {
        type: String,
        trim: true
      }
    }],
    // Blood group
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      trim: true
    },
    // Height and weight for BMI calculation
    height: {
      type: Number,
      min: 0
    },
    weight: {
      type: Number,
      min: 0
    },
    // Additional notes
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Index for faster queries
medicalHistorySchema.index({ userId: 1 });

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);


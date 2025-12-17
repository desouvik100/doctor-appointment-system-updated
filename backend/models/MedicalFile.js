/**
 * MedicalFile Model
 * Stores metadata for medical documents uploaded to Cloudinary
 * Actual files are stored in cloud storage, only references stored here
 */

const mongoose = require('mongoose');

const medicalFileSchema = new mongoose.Schema({
  // Who uploaded the file
  uploadedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'receptionist', 'admin'],
      required: true
    }
  },

  // What this file relates to
  relatedTo: {
    type: {
      type: String,
      enum: ['appointment', 'prescription', 'profile', 'lab_report', 'medical_record', 'general'],
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTo.refModel'
    },
    refModel: {
      type: String,
      enum: ['Appointment', 'Prescription', 'User', 'LabReport', 'MedicalRecord']
    }
  },

  // Patient this file belongs to (for easy querying)
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // File metadata from Cloudinary
  file: {
    publicId: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    secureUrl: {
      type: String,
      required: true
    },
    format: {
      type: String,
      required: true
    },
    resourceType: {
      type: String,
      enum: ['image', 'raw'],
      default: 'image'
    },
    sizeKB: {
      type: Number,
      required: true
    },
    width: Number,
    height: Number,
    originalFilename: String
  },

  // File categorization
  category: {
    type: String,
    enum: ['prescription', 'lab_report', 'xray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'blood_test', 'other'],
    default: 'other'
  },

  // User-provided description
  title: {
    type: String,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },

  // Visibility controls - who can see this file
  visibility: {
    patient: {
      type: Boolean,
      default: true
    },
    doctor: {
      type: Boolean,
      default: true
    },
    staff: {
      type: Boolean,
      default: false // Staff cannot see medical images by default
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

// Indexes for efficient querying
medicalFileSchema.index({ patientId: 1, createdAt: -1 });
medicalFileSchema.index({ 'uploadedBy.userId': 1 });
medicalFileSchema.index({ 'relatedTo.type': 1, 'relatedTo.referenceId': 1 });
medicalFileSchema.index({ category: 1 });

// Virtual for checking if file is an image
medicalFileSchema.virtual('isImage').get(function() {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(this.file.format?.toLowerCase());
});

// Method to check if user can view this file
medicalFileSchema.methods.canView = function(userId, userRole) {
  if (this.isDeleted) return false;
  
  // Owner can always view
  if (this.patientId.toString() === userId.toString()) return true;
  if (this.uploadedBy.userId.toString() === userId.toString()) return true;
  
  // Check role-based visibility
  if (userRole === 'admin') return true;
  if (userRole === 'doctor' && this.visibility.doctor) return true;
  if (userRole === 'patient' && this.visibility.patient) return true;
  if (['receptionist', 'staff'].includes(userRole) && this.visibility.staff) return true;
  
  return false;
};

// Soft delete method
medicalFileSchema.methods.softDelete = async function(deletedByUserId) {
  this.isDeleted = true;
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = deletedByUserId;
  return this.save();
};

module.exports = mongoose.model('MedicalFile', medicalFileSchema);

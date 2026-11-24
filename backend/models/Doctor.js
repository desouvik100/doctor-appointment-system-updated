const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please enter a valid email address'
      }
    },
    phone: { 
      type: String, 
      required: true,
      trim: true
    },
    specialization: { 
      type: String, 
      required: true,
      trim: true
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true
    },
    availability: {
      type: String,
      default: "Available"
    },
    weeklySchedule: {
      monday: {
        isAvailable: { type: Boolean, default: true },
        slots: [{
          startTime: String, 
          endTime: String,   
          type: { type: String, enum: ['in-clinic', 'virtual', 'both'], default: 'both' },
          maxPatients: { type: Number, default: 10 }
        }]
      },
      tuesday: {
        isAvailable: { type: Boolean, default: true },
        slots: [{
          startTime: String,
          endTime: String,
          type: { type: String, enum: ['in-clinic', 'virtual', 'both'], default: 'both' },
          maxPatients: { type: Number, default: 10 }
        }]
      },
      wednesday: {
        isAvailable: { type: Boolean, default: true },
        slots: [{
          startTime: String,
          endTime: String,
          type: { type: String, enum: ['in-clinic', 'virtual', 'both'], default: 'both' },
          maxPatients: { type: Number, default: 10 }
        }]
      },
      thursday: {
        isAvailable: { type: Boolean, default: true },
        slots: [{
          startTime: String,
          endTime: String,
          type: { type: String, enum: ['in-clinic', 'virtual', 'both'], default: 'both' },
          maxPatients: { type: Number, default: 10 }
        }]
      },
      friday: {
        isAvailable: { type: Boolean, default: true },
        slots: [{
          startTime: String,
          endTime: String,
          type: { type: String, enum: ['in-clinic', 'virtual', 'both'], default: 'both' },
          maxPatients: { type: Number, default: 10 }
        }]
      },
      saturday: {
        isAvailable: { type: Boolean, default: true },
        slots: [{
          startTime: String,
          endTime: String,
          type: { type: String, enum: ['in-clinic', 'virtual', 'both'], default: 'both' },
          maxPatients: { type: Number, default: 10 }
        }]
      },
      sunday: {
        isAvailable: { type: Boolean, default: false },
        slots: [{
          startTime: String,
          endTime: String,
          type: { type: String, enum: ['in-clinic', 'virtual', 'both'], default: 'both' },
          maxPatients: { type: Number, default: 10 }
        }]
      }
    },
    specialDates: [{
      date: { type: Date, required: true },
      isAvailable: { type: Boolean, default: true },
      reason: String, 
      slots: [{
        startTime: String,
        endTime: String,
        type: { type: String, enum: ['in-clinic', 'virtual', 'both'], default: 'both' },
        maxPatients: { type: Number, default: 10 }
      }]
    }],
    consultationSettings: {
      virtualConsultationEnabled: { type: Boolean, default: true },
      inClinicConsultationEnabled: { type: Boolean, default: true },
      virtualConsultationFee: { type: Number, default: null }, 
      slotDuration: { type: Number, default: 15 }, 
      bufferTime: { type: Number, default: 5 }, 
      advanceBookingDays: { type: Number, default: 30 }, 
      cancellationHours: { type: Number, default: 24 }, 
      virtualSlotDuration: { type: Number, default: 20 }, 
      inClinicSlotDuration: { type: Number, default: 30 }, 
      maxVirtualSlots: { type: Number, default: 15 }, 
      maxInClinicSlots: { type: Number, default: 20 }, 
      virtualStartTime: { type: String, default: '08:00' }, 
      virtualEndTime: { type: String, default: '20:00' },
      inClinicStartTime: { type: String, default: '09:00' },
      inClinicEndTime: { type: String, default: '19:00' }
    },
    consultationFee: {
      type: Number,
      default: 500
    },
    consultationDuration: {
      type: Number,
      default: 30,
      min: 10,
      max: 120
    },
    experience: {
      type: Number,
      default: 0
    },
    qualification: {
      type: String,
      default: "MBBS"
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    suspendedAt: {
      type: Date,
      default: null
    },
    suspendReason: {
      type: String,
      default: null
    },
    forceLogoutAt: {
      type: Date,
      default: null
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    profilePhoto: {
      type: String,
      default: null
    },
    profilePhotoPublicId: {
      type: String,
      default: null
    },
    verificationDocs: {
      license: {
        url: String,
        publicId: String,
        uploadedAt: Date,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
      },
      degree: {
        url: String,
        publicId: String,
        uploadedAt: Date,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
      },
      id_proof: {
        url: String,
        publicId: String,
        uploadedAt: Date,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
      }
    },
    bio: {
      type: String,
      trim: true
    },
    languages: [{
      type: String
    }],
    registrationNumber: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      default: null
    },
    googleId: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: null
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved' 
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    termsAccepted: {
      type: Boolean,
      default: false
    },
    termsAcceptedAt: {
      type: Date,
      default: null
    },
    privacyPolicyAccepted: {
      type: Boolean,
      default: false
    },
    privacyPolicyAcceptedAt: {
      type: Date,
      default: null
    },
    bookingControls: {
      onlineBookingPaused: { type: Boolean, default: false },
      clinicBookingPaused: { type: Boolean, default: false },
      pauseReason: { type: String, default: '' },
      clinicPauseReason: { type: String, default: '' },
      pausedUntil: { type: Date, default: null },
      clinicPausedUntil: { type: Date, default: null },
      onlinePausedAt: { type: Date, default: null },
      clinicPausedAt: { type: Date, default: null }
    },
    blockedDays: [{
      date: { type: Date, required: true },
      reason: { type: String, default: 'Emergency leave' },
      createdAt: { type: Date, default: Date.now }
    }],
    extendedHours: [{
      date: { type: Date, required: true },
      newEndTime: { type: String, required: true },
      reason: { type: String, default: 'Extended hours' },
      createdAt: { type: Date, default: Date.now }
    }],
    isOnline: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: null },
    onlineStatusUpdatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);
doctorSchema.index({ email: 1 });
doctorSchema.index({ specialization: 1, isActive: 1 });
doctorSchema.index({ clinicId: 1, isActive: 1 });
doctorSchema.index({ approvalStatus: 1, isActive: 1 });
doctorSchema.index({ rating: -1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ availability: 1, isActive: 1 });
doctorSchema.index({ isOnline: 1, lastActiveAt: -1 });
doctorSchema.index({ createdAt: -1 });
doctorSchema.index({ name: 'text', specialization: 'text', qualification: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
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
    // Weekly Schedule - Doctor's regular availability
    weeklySchedule: {
      monday: {
        isAvailable: { type: Boolean, default: true },
        slots: [{
          startTime: String, // "09:00"
          endTime: String,   // "13:00"
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
    // Special dates - Override weekly schedule for specific dates
    specialDates: [{
      date: { type: Date, required: true },
      isAvailable: { type: Boolean, default: true },
      reason: String, // "Holiday", "Conference", "Emergency Leave"
      slots: [{
        startTime: String,
        endTime: String,
        type: { type: String, enum: ['in-clinic', 'virtual', 'both'], default: 'both' },
        maxPatients: { type: Number, default: 10 }
      }]
    }],
    // Consultation settings
    consultationSettings: {
      virtualConsultationEnabled: { type: Boolean, default: true },
      inClinicConsultationEnabled: { type: Boolean, default: true },
      virtualConsultationFee: { type: Number, default: null }, // null means same as consultationFee
      slotDuration: { type: Number, default: 15 }, // minutes per appointment (legacy)
      bufferTime: { type: Number, default: 5 }, // minutes between appointments
      advanceBookingDays: { type: Number, default: 30 }, // How far in advance can patients book
      cancellationHours: { type: Number, default: 24 }, // Hours before appointment for free cancellation
      // Separate settings for virtual and in-clinic
      virtualSlotDuration: { type: Number, default: 20 }, // Virtual consultations typically shorter
      inClinicSlotDuration: { type: Number, default: 30 }, // In-clinic consultations
      maxVirtualSlots: { type: Number, default: 15 }, // Max virtual appointments per day
      maxInClinicSlots: { type: Number, default: 20 }, // Max in-clinic appointments per day
      virtualStartTime: { type: String, default: '08:00' }, // Virtual can start earlier
      virtualEndTime: { type: String, default: '20:00' },
      inClinicStartTime: { type: String, default: '09:00' },
      inClinicEndTime: { type: String, default: '19:00' }
    },
    consultationFee: {
      type: Number,
      default: 500
    },
    // Consultation duration in minutes (for queue-based booking)
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
    // Rating & Reviews
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
    // Profile
    profilePhoto: {
      type: String,
      default: null
    },
    profilePhotoPublicId: {
      type: String,
      default: null
    },
    // Verification Documents (Cloudinary)
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
    // Authentication
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
    // Admin Approval System
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved' // Existing doctors are approved by default
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
    // Terms and Conditions Acceptance
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
    // ===== BOOKING CONTROLS (Doctor Override) =====
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
    // Blocked days (emergency leaves)
    blockedDays: [{
      date: { type: Date, required: true },
      reason: { type: String, default: 'Emergency leave' },
      createdAt: { type: Date, default: Date.now }
    }],
    // Extended hours for specific days
    extendedHours: [{
      date: { type: Date, required: true },
      newEndTime: { type: String, required: true },
      reason: { type: String, default: 'Extended hours' },
      createdAt: { type: Date, default: Date.now }
    }],
    // Online Status Tracking
    isOnline: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: null },
    onlineStatusUpdatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// ===== PERFORMANCE INDEXES =====
doctorSchema.index({ email: 1 });
doctorSchema.index({ specialization: 1, isActive: 1 });
doctorSchema.index({ clinicId: 1, isActive: 1 });
doctorSchema.index({ approvalStatus: 1 });
doctorSchema.index({ rating: -1 }); // For sorting by rating
doctorSchema.index({ consultationFee: 1 }); // For price filtering
doctorSchema.index({ 'availability': 1, isActive: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
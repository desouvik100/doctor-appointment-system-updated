const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
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
    password: { 
      type: String, 
      required: true 
    },
    phone: {
      type: String,
      trim: true
    },
    profilePhoto: {
      type: String,
      default: null // URL or base64 string for profile picture
    },
    googleId: {
      type: String,
      default: null // Google OAuth ID for social login
    },
    role: {
      type: String,
      enum: ["patient", "admin", "receptionist"],
      default: "patient",
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved"
    },
    clinicName: {
      type: String,
      trim: true
    },
    loginLocation: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      },
      address: {
        type: String,
        default: null
      },
      city: {
        type: String,
        default: null
      },
      state: {
        type: String,
        default: null
      },
      country: {
        type: String,
        default: null
      },
      pincode: {
        type: String,
        default: null
      },
      lastUpdated: {
        type: Date,
        default: null
      }
    },
    locationCaptured: {
      type: Boolean,
      default: false
    },
    // Favorite Doctors
    favoriteDoctors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    }],
    // Family Members
    familyMembers: [{
      name: { type: String, required: true },
      relationship: { type: String, required: true }, // spouse, child, parent, sibling, other
      age: { type: Number },
      gender: { type: String, enum: ['male', 'female', 'other'] },
      phone: { type: String },
      bloodGroup: { type: String },
      allergies: [{ type: String }],
      chronicConditions: [{ type: String }],
      createdAt: { type: Date, default: Date.now }
    }],
    // Medical History
    medicalHistory: {
      bloodGroup: { type: String },
      allergies: [{ type: String }],
      chronicConditions: [{ type: String }],
      currentMedications: [{ type: String }],
      pastSurgeries: [{ 
        name: String, 
        date: Date, 
        hospital: String 
      }],
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String
      }
    },
    // Health Reports
    healthReports: [{
      name: { type: String, required: true },
      type: { type: String }, // lab_report, xray, mri, prescription, other
      fileUrl: { type: String },
      uploadedAt: { type: Date, default: Date.now },
      notes: { type: String }
    }],
    // Notification Preferences
    notificationPreferences: {
      emailReminders: { type: Boolean, default: true },
      smsReminders: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      reminderHoursBefore: { type: Number, default: 24 }
    },
    // Mobile Device Tokens (FCM)
    devices: [{
      fcmToken: { type: String, required: true },
      platform: { type: String, enum: ['android', 'ios', 'web'] },
      deviceId: { type: String },
      registeredAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// ===== PERFORMANCE INDEXES =====
userSchema.index({ email: 1 }); // Already unique, but explicit
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ clinicId: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ 'loginLocation.city': 1 });

module.exports = mongoose.model('User', userSchema);
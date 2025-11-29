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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
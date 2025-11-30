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
    consultationFee: {
      type: Number,
      default: 500
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
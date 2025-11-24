const mongoose = require('mongoose');

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true
    },
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      trim: true
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Please enter a valid time in HH:MM format'
      }
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Please enter a valid time in HH:MM format'
      }
    },
    slotDuration: {
      type: Number,
      required: true,
      default: 15,
      min: 5,
      max: 60
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night'],
      default: 'Morning'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    roomNumber: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Compound index to ensure unique schedule per doctor per day
doctorScheduleSchema.index({ doctorId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);



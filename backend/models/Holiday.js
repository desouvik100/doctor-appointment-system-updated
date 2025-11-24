const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      trim: true,
      default: 'Holiday'
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    // For recurring holidays (e.g., every year on same date)
    recurringYear: {
      type: Number
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate holidays
holidaySchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Holiday', holidaySchema);



const mongoose = require('mongoose');

const medicineReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  medicineName: {
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
    enum: ['once_daily', 'twice_daily', 'thrice_daily', 'four_times', 'every_6_hours', 'every_8_hours', 'every_12_hours', 'weekly', 'as_needed'],
    default: 'once_daily'
  },
  times: [{
    hour: { type: Number, min: 0, max: 23 },
    minute: { type: Number, min: 0, max: 59 },
    label: { type: String } 
  }],
  timing: {
    type: String,
    enum: ['before_food', 'after_food', 'with_food', 'empty_stomach', 'bedtime', 'any_time'],
    default: 'after_food'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  durationDays: {
    type: Number
  },
  instructions: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notificationEnabled: {
    type: Boolean,
    default: true
  },
  notificationMinutesBefore: {
    type: Number,
    default: 5
  },
  dosesTaken: [{
    scheduledTime: Date,
    takenAt: Date,
    status: {
      type: String,
      enum: ['taken', 'missed', 'skipped', 'pending'],
      default: 'pending'
    },
    notes: String
  }],
  totalDoses: {
    type: Number,
    default: 0
  },
  dosesTakenCount: {
    type: Number,
    default: 0
  },
  dosesMissedCount: {
    type: Number,
    default: 0
  },
  adherenceRate: {
    type: Number,
    default: 100
  },
  pillCount: {
    type: Number
  },
  refillReminderAt: {
    type: Number 
  },
  lastRefillDate: {
    type: Date
  }
}, {
  timestamps: true
});
medicineReminderSchema.methods.calculateAdherence = function() {
  if (this.totalDoses === 0) return 100;
  this.adherenceRate = Math.round((this.dosesTakenCount / this.totalDoses) * 100);
  return this.adherenceRate;
};
medicineReminderSchema.methods.isStillActive = function() {
  if (!this.isActive) return false;
  if (this.endDate && new Date() > this.endDate) return false;
  return true;
};

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);

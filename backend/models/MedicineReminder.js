const mongoose = require('mongoose');

const medicineReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
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
    enum: ['daily', 'twice', 'thrice', 'weekly', 'asNeeded'],
    default: 'daily'
  },
  times: [{
    type: String,  // Format: "HH:MM"
    required: true
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#667eea'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Track which reminders have been taken
  takenHistory: [{
    date: Date,
    time: String,
    takenAt: Date
  }],
  // Email reminder settings
  emailReminders: {
    type: Boolean,
    default: true
  },
  reminderMinutesBefore: {
    type: Number,
    default: 5  // Send email 5 minutes before
  },
  lastEmailSent: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Index for efficient querying
medicineReminderSchema.index({ userId: 1, isActive: 1 });
medicineReminderSchema.index({ 'times': 1, isActive: 1 });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);

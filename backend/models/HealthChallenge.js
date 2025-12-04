const mongoose = require('mongoose');

const healthChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['steps', 'medication', 'water', 'sleep', 'exercise', 'checkup', 'custom'],
    required: true
  },
  target: { type: Number, required: true },
  unit: String,
  duration: { type: Number, required: true }, // days
  rewardPoints: { type: Number, default: 100 },
  badgeIcon: String,
  badgeName: String,
  isActive: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    dailyLogs: [{
      date: Date,
      value: Number
    }],
    joinedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('HealthChallenge', healthChallengeSchema);

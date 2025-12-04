const mongoose = require('mongoose');

const marketingCampaignSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['sms', 'whatsapp', 'email', 'push', 'in_app'],
    required: true
  },
  targetAudience: {
    type: { type: String, enum: ['all', 'segment', 'custom'] },
    filters: {
      ageRange: { min: Number, max: Number },
      gender: String,
      lastVisit: { days: Number, operator: String },
      appointmentCount: { count: Number, operator: String },
      location: String
    },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  content: {
    subject: String,
    message: String,
    imageUrl: String,
    ctaText: String,
    ctaLink: String
  },
  schedule: {
    type: { type: String, enum: ['immediate', 'scheduled', 'recurring'] },
    scheduledAt: Date,
    recurringPattern: String
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'completed', 'paused'],
    default: 'draft'
  },
  analytics: {
    totalSent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 }
  },
  budget: Number,
  spent: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('MarketingCampaign', marketingCampaignSchema);

const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['nps', 'satisfaction', 'feedback', 'custom'], required: true },
  questions: [{
    question: String,
    type: { type: String, enum: ['rating', 'text', 'multiple', 'boolean'] },
    options: [String],
    required: { type: Boolean, default: false }
  }],
  triggerEvent: {
    type: String,
    enum: ['after_appointment', 'after_purchase', 'periodic', 'manual'],
    default: 'after_appointment'
  },
  isActive: { type: Boolean, default: true },
  responses: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    answers: [{
      questionIndex: Number,
      answer: mongoose.Schema.Types.Mixed
    }],
    npsScore: Number,
    feedback: String,
    createdAt: { type: Date, default: Date.now }
  }],
  analytics: {
    totalResponses: { type: Number, default: 0 },
    averageNps: { type: Number, default: 0 },
    promoters: { type: Number, default: 0 },
    passives: { type: Number, default: 0 },
    detractors: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Calculate NPS
surveySchema.methods.calculateNPS = function() {
  const responses = this.responses.filter(r => r.npsScore !== undefined);
  if (responses.length === 0) return 0;
  
  let promoters = 0, detractors = 0;
  responses.forEach(r => {
    if (r.npsScore >= 9) promoters++;
    else if (r.npsScore <= 6) detractors++;
  });
  
  return Math.round(((promoters - detractors) / responses.length) * 100);
};

module.exports = mongoose.model('Survey', surveySchema);

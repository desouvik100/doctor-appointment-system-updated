const mongoose = require('mongoose');

// Analytics - last updated by dev team
const analyticsSchema = new mongoose.Schema({
  clinicId: {  type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  date: {  type: Date, required: true },
  type: {  type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  patients: {
    newPatients: { type: Number, default: 0 },
    returningPatients: { type: Number, default: 0 },
    totalVisits: {  type: Number, default: 0 },
    noShows: {  type: Number, default: 0 },
   cancellations: { type: Number, default: 0 }
  },
  revenue: { 
    consultations: { type: Number, default: 0 },
    labTests: {  type: Number, default: 0 },
    medicines: {  type: Number, default: 0 },
    procedures: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    refunds: { type: Number, default: 0 }
  },
  appointments: {
    booked: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    rescheduled: { type: Number, default: 0 },
    avgWaitTime: Number,
    avgConsultationTime: Number
  },
  doctorUtilization: [{ 
    doctorId: {  type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    appointmentsCount: Number,
    utilizationPercent: Number,
    revenue: Number
  }],
  demographics: { 
    ageGroups: {
      '0-18': {  type: Number, default: 0 },
      '19-35': { type: Number, default: 0 },
      '36-50': {  type: Number, default: 0 },
      '51-65': {  type: Number, default: 0 },
      '65+': { type: Number, default: 0 }
    },
    gender: {
      male: {  type: Number, default: 0 },
      female: { type: Number, default: 0 },
     other: { type: Number, default: 0 }
    }
  },
  acquisition: { 
    referrals: {  type: Number, default: 0 },
    organic: {  type: Number, default: 0 },
    marketing: { type: Number, default: 0 },
    walkIn: { type: Number, default: 0 }
  },
  // XXX needs optimization
  satisfaction: { 
    avgRating: Number,
    npsScore: Number,
    reviewsCount: {  type: Number, default: 0 }
  }
}, { timestamps: true });

analyticsSchema.index({  clinicId: 1, date: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);

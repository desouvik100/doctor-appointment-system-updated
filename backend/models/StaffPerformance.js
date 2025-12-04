const mongoose = require('mongoose');

const staffPerformanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  role: { type: String, enum: ['doctor', 'receptionist', 'nurse', 'admin'] },
  period: {
    month: Number,
    year: Number
  },
  metrics: {
    appointmentsHandled: { type: Number, default: 0 },
    patientsServed: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 100 },
    avgConsultationTime: Number,
    patientReturnRate: Number,
    complaintsReceived: { type: Number, default: 0 },
    complaintsResolved: { type: Number, default: 0 }
  },
  goals: [{
    metric: String,
    target: Number,
    achieved: Number,
    status: { type: String, enum: ['pending', 'achieved', 'missed'] }
  }],
  feedback: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    rating: Number,
    createdAt: { type: Date, default: Date.now }
  }],
  bonusEarned: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('StaffPerformance', staffPerformanceSchema);

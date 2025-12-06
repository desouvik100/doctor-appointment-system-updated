const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Detailed ratings
  ratings: {
    consultation: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    cleanliness: { type: Number, min: 1, max: 5 },
    valueForMoney: { type: Number, min: 1, max: 5 }
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  review: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    enum: ['friendly', 'professional', 'thorough', 'quick', 'knowledgeable', 'patient', 'helpful', 'recommended']
  }],
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: true // Verified because linked to appointment
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved'
  },
  // Doctor response
  doctorResponse: {
    text: String,
    respondedAt: Date
  },
  // Helpful votes
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votedAt: Date
  }],
  // Report
  reportedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    reportedAt: Date
  }]
}, {
  timestamps: true
});

// Index for efficient queries
reviewSchema.index({ doctorId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ patientId: 1, createdAt: -1 });

// Static method to calculate doctor's average rating
reviewSchema.statics.calculateDoctorRating = async function(doctorId) {
  const result = await this.aggregate([
    { $match: { doctorId: mongoose.Types.ObjectId(doctorId), status: 'approved' } },
    {
      $group: {
        _id: '$doctorId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        avgConsultation: { $avg: '$ratings.consultation' },
        avgCommunication: { $avg: '$ratings.communication' },
        avgPunctuality: { $avg: '$ratings.punctuality' },
        recommendRate: { $avg: { $cond: ['$wouldRecommend', 1, 0] } }
      }
    }
  ]);

  return result[0] || {
    averageRating: 0,
    totalReviews: 0,
    avgConsultation: 0,
    avgCommunication: 0,
    avgPunctuality: 0,
    recommendRate: 0
  };
};

module.exports = mongoose.model('Review', reviewSchema);

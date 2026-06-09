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
  visitType: {
    type: String,
    enum: ['in-clinic', 'virtual'],
    default: 'in-clinic'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected', 'flagged'],
    default: 'approved'
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  unhelpfulCount: {
    type: Number,
    default: 0
  },
  photo: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for sorting and filtering approved reviews efficiently
reviewSchema.index({ doctorId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ doctorId: 1, rating: 1, status: 1 });
reviewSchema.index({ doctorId: 1, visitType: 1, status: 1 });
reviewSchema.index({ doctorId: 1, isVerified: 1, status: 1 });

// Static method to calculate doctor's average rating and total counts
reviewSchema.statics.calculateDoctorRating = async function(doctorId) {
  const result = await this.aggregate([
    { $match: { doctorId: new mongoose.Types.ObjectId(doctorId), status: 'approved' } },
    {
      $group: {
        _id: '$doctorId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  return result[0] || {
    averageRating: 0,
    totalReviews: 0
  };
};

module.exports = mongoose.model('Review', reviewSchema);

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true
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
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    // Detailed ratings
    ratings: {
      punctuality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      treatment: { type: Number, min: 1, max: 5 },
      cleanliness: { type: Number, min: 1, max: 5 }
    },
    isVerified: {
      type: Boolean,
      default: true // Verified if linked to a completed appointment
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    response: {
      text: String,
      respondedAt: Date
    }
  },
  { timestamps: true }
);

// Ensure one review per appointment
reviewSchema.index({ appointmentId: 1 }, { unique: true });
reviewSchema.index({ doctorId: 1, createdAt: -1 });

// Update doctor's average rating after saving a review
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const Doctor = mongoose.model('Doctor');
  
  const stats = await Review.aggregate([
    { $match: { doctorId: this.doctorId, isVisible: true } },
    { 
      $group: { 
        _id: '$doctorId', 
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      } 
    }
  ]);

  if (stats.length > 0) {
    await Doctor.findByIdAndUpdate(this.doctorId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);

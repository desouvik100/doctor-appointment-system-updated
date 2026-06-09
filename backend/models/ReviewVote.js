const mongoose = require('mongoose');

const reviewVoteSchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  voteType: {
    type: String,
    enum: ['helpful', 'unhelpful'],
    required: true
  }
}, {
  timestamps: true
});

// Enforce unique vote per user per review
reviewVoteSchema.index({ reviewId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ReviewVote', reviewVoteSchema);

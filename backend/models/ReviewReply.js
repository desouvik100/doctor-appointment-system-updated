const mongoose = require('mongoose');

const reviewReplySchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewReply',
    default: null 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['Patient', 'Doctor', 'ClinicStaff'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  depth: {
    type: Number,
    default: 1, 
    min: 1,
    max: 3
  }
}, {
  timestamps: true
});

reviewReplySchema.index({ reviewId: 1, parentId: 1, createdAt: 1 });

module.exports = mongoose.model('ReviewReply', reviewReplySchema);
